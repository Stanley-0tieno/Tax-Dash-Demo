package tax.innovation.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tax.innovation.dto.CompanyProfileDto;
import tax.innovation.dto.UpdateProfileDto;
import tax.innovation.service.CompanyProfileService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/profile")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class CompanyProfileController {

    private final CompanyProfileService profileService;

    public CompanyProfileController(CompanyProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<CompanyProfileDto> getProfile(Authentication authentication) {
        try {
            String email = authentication.getName();
            System.out.println("Fetching profile for user: " + email);
            CompanyProfileDto profile = profileService.getProfile(email);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            System.err.println("Error fetching profile: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestBody UpdateProfileDto updateDto,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            System.out.println("Updating profile for user: " + email);
            CompanyProfileDto updatedProfile = profileService.updateProfile(email, updateDto);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Profile updated successfully");
            response.put("profile", updatedProfile);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error updating profile: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to update profile: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadLogo(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            System.out.println("Uploading logo for user: " + email);
            String logoUrl = profileService.uploadLogo(email, file);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Logo uploaded successfully");
            response.put("logoUrl", logoUrl);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid logo upload: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            System.err.println("Error uploading logo: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to upload logo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/logo")
    public ResponseEntity<Map<String, Object>> deleteLogo(Authentication authentication) {
        try {
            String email = authentication.getName();
            System.out.println("Deleting logo for user: " + email);
            profileService.deleteLogo(email);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Logo deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error deleting logo: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to delete logo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/completion")
    public ResponseEntity<Map<String, Object>> getProfileCompletion(Authentication authentication) {
        try {
            String email = authentication.getName();
            int completion = profileService.getProfileCompletion(email);
            Map<String, Object> response = new HashMap<>();
            response.put("completion", completion);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error getting profile completion: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
