package tax.innovation.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequiredArgsConstructor
@Slf4j
public class CompanyProfileController {

    private final CompanyProfileService profileService;

    /**
     * Get company profile for authenticated user
     */
    @GetMapping
    public ResponseEntity<CompanyProfileDto> getProfile(Authentication authentication) {
        try {
            String email = authentication.getName();
            log.info("Fetching profile for user: {}", email);
            
            CompanyProfileDto profile = profileService.getProfile(email);
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            log.error("Error fetching profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update company profile
     */
    @PutMapping
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestBody UpdateProfileDto updateDto,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            log.info("Updating profile for user: {}", email);
            
            CompanyProfileDto updatedProfile = profileService.updateProfile(email, updateDto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Profile updated successfully");
            response.put("profile", updatedProfile);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error updating profile", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to update profile: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Upload company logo
     */
    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadLogo(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            log.info("Uploading logo for user: {}", email);
            
            String logoUrl = profileService.uploadLogo(email, file);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Logo uploaded successfully");
            response.put("logoUrl", logoUrl);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Invalid logo upload: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (Exception e) {
            log.error("Error uploading logo", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to upload logo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Delete company logo
     */
    @DeleteMapping("/logo")
    public ResponseEntity<Map<String, Object>> deleteLogo(Authentication authentication) {
        try {
            String email = authentication.getName();
            log.info("Deleting logo for user: {}", email);
            
            profileService.deleteLogo(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Logo deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error deleting logo", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to delete logo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get profile completion percentage
     */
    @GetMapping("/completion")
    public ResponseEntity<Map<String, Object>> getProfileCompletion(Authentication authentication) {
        try {
            String email = authentication.getName();
            int completion = profileService.getProfileCompletion(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("completion", completion);
            response.put("hint", getCompletionHint(completion));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting profile completion", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String getCompletionHint(int completion) {
        if (completion < 70) {
            return "Upload your company logo to personalize your profile.";
        } else if (completion < 80) {
            return "Upload compliance certificate to reach 100% completion.";
        } else if (completion < 90) {
            return "Add your bank details for seamless transactions.";
        } else if (completion < 100) {
            return "Complete all remaining steps to unlock full features.";
        }
        return "Your profile is complete!";
    }
}