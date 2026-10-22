-- Rename stored Firebase image URLs to object paths.
ALTER TABLE product_images RENAME COLUMN url TO path;

-- Convert legacy Firebase download URLs to the encoded object path.
UPDATE product_images
SET path = replace(
    replace(
        replace(substring(path FROM '/o/([^?]+)'), '%2F', '/', 'gi'),
        '%20', ' ', 'gi'
    ),
    '%2B', '+', 'gi'
)
WHERE path LIKE 'https://firebasestorage.googleapis.com/%/o/%';
