-- Rename stored Firebase image URLs to object paths.
-- Existing values remain intact and may need manual conversion if they contain download URLs.
ALTER TABLE product_images RENAME COLUMN url TO path;
