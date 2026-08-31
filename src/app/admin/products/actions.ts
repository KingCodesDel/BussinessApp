"use server";

import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(formData: FormData) {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const priceCents = Math.round(parseFloat(String(formData.get("price") ?? "0")) * 100);
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10);
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const videoUrl = String(formData.get("video_url") ?? "") || null;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      business_id: business.id,
      title,
      slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`,
      description,
      price_cents: priceCents,
      stock_quantity: stock,
      category_id: categoryId,
      video_url: videoUrl,
    })
    .select()
    .single();

  if (error || !product) {
    redirect("/admin/products/new?error=1");
  }

  // handle image uploads to Supabase Storage bucket "product-images"
  const images = formData.getAll("images") as File[];
  let sortOrder = 0;
  let uploadFailures = 0;
  for (const file of images) {
    if (!file || file.size === 0) continue;
    const path = `${business.id}/${product!.id}/${Date.now()}-${sortOrder}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);
    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
      await supabase.from("product_images").insert({
        product_id: product!.id,
        url: publicUrl.publicUrl,
        sort_order: sortOrder,
      });
    } else {
      console.error(`Failed to upload product image ${sortOrder}:`, uploadError.message);
      uploadFailures++;
    }
    sortOrder++;
  }

  revalidatePath("/admin/products");
  redirect(
    uploadFailures > 0
      ? `/admin/products?created=1&image_errors=${uploadFailures}`
      : "/admin/products?created=1"
  );
}

export async function updateProduct(productId: string, formData: FormData) {
  const { business } = await requireBusiness();
  const supabase = createClient();

  await supabase
    .from("products")
    .update({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      price_cents: Math.round(parseFloat(String(formData.get("price") ?? "0")) * 100),
      stock_quantity: parseInt(String(formData.get("stock") ?? "0"), 10),
      is_active: formData.get("is_active") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("business_id", business.id);

  // handle any newly added images, same as product creation
  const images = formData.getAll("images") as File[];
  const newFiles = images.filter((f) => f && f.size > 0);
  if (newFiles.length > 0) {
    const { count: existingCount } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    let sortOrder = existingCount ?? 0;
    let uploadFailures = 0;
    for (const file of newFiles) {
      const path = `${business.id}/${productId}/${Date.now()}-${sortOrder}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);
      if (!uploadError) {
        const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
        await supabase.from("product_images").insert({ product_id: productId, url: publicUrl.publicUrl, sort_order: sortOrder });
      } else {
        console.error(`Failed to upload product image ${sortOrder}:`, uploadError.message);
        uploadFailures++;
      }
      sortOrder++;
    }
    revalidatePath("/admin/products");
    redirect(
      uploadFailures > 0
        ? `/admin/products?updated=1&image_errors=${uploadFailures}`
        : "/admin/products?updated=1"
    );
  }

  revalidatePath("/admin/products");
  redirect("/admin/products?updated=1");
}

export async function deleteProductImage(imageId: string, productId: string) {
  const { business } = await requireBusiness();
  const supabase = createClient();
  // ownership check: the image's product must belong to this business
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!product) return;
  await supabase.from("product_images").delete().eq("id", imageId).eq("product_id", productId);
  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteProduct(productId: string) {
  const { business } = await requireBusiness();
  const supabase = createClient();
  await supabase.from("products").delete().eq("id", productId).eq("business_id", business.id);
  revalidatePath("/admin/products");
}

export async function createCategory(formData: FormData) {
  const { business } = await requireBusiness();
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await supabase.from("categories").insert({
    business_id: business.id,
    name,
    slug: slugify(name),
  });
  revalidatePath("/admin/products/new");
}
