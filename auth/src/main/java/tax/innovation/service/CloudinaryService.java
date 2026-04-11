package tax.innovation.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadCompanyLogo(MultipartFile file, String kraPin) {
        try {
            if (file.isEmpty()) throw new IllegalArgumentException("File is empty");

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/"))
                throw new IllegalArgumentException("File must be an image");

            if (file.getSize() > 5 * 1024 * 1024)
                throw new IllegalArgumentException("File size must not exceed 5MB");

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ?
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".png";
            String publicId = "company-logos/" + kraPin + "/" + UUID.randomUUID() + extension;

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", "taxdash/company-logos",
                    "overwrite", true,
                    "resource_type", "image"
                )
            );

            String secureUrl = (String) uploadResult.get("secure_url");
            System.out.println("Uploaded logo for KRA PIN: " + kraPin + " -> " + secureUrl);
            return secureUrl;

        } catch (IOException e) {
            System.err.println("Error uploading logo for KRA PIN: " + kraPin + " - " + e.getMessage());
            throw new RuntimeException("Failed to upload logo: " + e.getMessage());
        }
    }

    public void deleteCompanyLogo(String imageUrl) {
        try {
            if (imageUrl == null || imageUrl.isEmpty()) return;
            String publicId = extractPublicId(imageUrl);
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                System.out.println("Deleted logo with public ID: " + publicId);
            }
        } catch (IOException e) {
            System.err.println("Error deleting logo: " + imageUrl + " - " + e.getMessage());
        }
    }

    private String extractPublicId(String imageUrl) {
        try {
            String[] parts = imageUrl.split("/upload/");
            if (parts.length > 1) {
                String afterUpload = parts[1].replaceFirst("v\\d+/", "");
                int lastDot = afterUpload.lastIndexOf('.');
                return lastDot > 0 ? afterUpload.substring(0, lastDot) : afterUpload;
            }
        } catch (Exception e) {
            System.out.println("Could not extract public ID from URL: " + imageUrl);
        }
        return null;
    }
}
