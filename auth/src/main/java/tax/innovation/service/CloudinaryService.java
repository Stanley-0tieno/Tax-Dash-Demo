package tax.innovation.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload company logo to Cloudinary
     * 
     * @param file the logo file
     * @param kraPin company KRA PIN for folder organization
     * @return the secure URL of the uploaded image
     */
    public String uploadCompanyLogo(MultipartFile file, String kraPin) {
        try {
            // Validate file
            if (file.isEmpty()) {
                throw new IllegalArgumentException("File is empty");
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("File must be an image");
            }

            // Validate file size (max 5MB for MVP)
            long maxSize = 5 * 1024 * 1024; // 5MB
            if (file.getSize() > maxSize) {
                throw new IllegalArgumentException("File size must not exceed 5MB");
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".png";
            String publicId = "company-logos/" + kraPin + "/" + UUID.randomUUID() + extension;

            // Upload to Cloudinary with transformations
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", "taxdash/company-logos",
                    "transformation", new com.cloudinary.Transformation()
                        .width(400)
                        .height(400)
                        .crop("fill")
                        .quality("auto")
                        .fetchFormat("auto"),
                    "overwrite", true,
                    "resource_type", "image"
                )
            );

            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("Successfully uploaded logo for KRA PIN: {} to {}", kraPin, secureUrl);
            
            return secureUrl;

        } catch (IOException e) {
            log.error("Error uploading logo for KRA PIN: {}", kraPin, e);
            throw new RuntimeException("Failed to upload logo: " + e.getMessage());
        }
    }

    /**
     * Delete company logo from Cloudinary
     * 
     * @param imageUrl the URL of the image to delete
     */
    public void deleteCompanyLogo(String imageUrl) {
        try {
            if (imageUrl == null || imageUrl.isEmpty()) {
                return;
            }

            // Extract public ID from URL
            String publicId = extractPublicId(imageUrl);
            
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("Successfully deleted logo with public ID: {}", publicId);
            }

        } catch (IOException e) {
            log.error("Error deleting logo: {}", imageUrl, e);
            // Don't throw exception - logo deletion failure shouldn't block updates
        }
    }

    /**
     * Extract Cloudinary public ID from secure URL
     */
    private String extractPublicId(String imageUrl) {
        try {
            // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
            String[] parts = imageUrl.split("/upload/");
            if (parts.length > 1) {
                String afterUpload = parts[1];
                // Remove version if present (v1234567890/)
                afterUpload = afterUpload.replaceFirst("v\\d+/", "");
                // Remove extension
                int lastDot = afterUpload.lastIndexOf('.');
                if (lastDot > 0) {
                    return afterUpload.substring(0, lastDot);
                }
                return afterUpload;
            }
        } catch (Exception e) {
            log.warn("Could not extract public ID from URL: {}", imageUrl);
        }
        return null;
    }
}