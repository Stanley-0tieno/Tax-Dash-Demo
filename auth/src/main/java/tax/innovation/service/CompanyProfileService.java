package tax.innovation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tax.innovation.dto.CompanyProfileDto;
import tax.innovation.dto.UpdateProfileDto;
import tax.innovation.model.User;
import tax.innovation.repository.UserRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyProfileService {

    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    /**
     * Get company profile for user
     */
    public CompanyProfileDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToProfileDto(user);
    }

    /**
     * Update company profile
     */
    @Transactional
    public CompanyProfileDto updateProfile(String email, UpdateProfileDto updateDto) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Update fields if provided
        if (updateDto.getCompany() != null) {
            user.setCompany(updateDto.getCompany());
        }
        if (updateDto.getSector() != null) {
            user.setSector(updateDto.getSector());
        }
        if (updateDto.getPhone() != null) {
            user.setPhone(updateDto.getPhone());
        }
        if (updateDto.getEmail() != null && !updateDto.getEmail().equals(email)) {
            // Check if new email already exists
            if (userRepository.existsByEmail(updateDto.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(updateDto.getEmail());
        }
        if (updateDto.getAddress() != null) {
            user.setAddress(updateDto.getAddress());
        }
        if (updateDto.getRegNumber() != null) {
            user.setRegNumber(updateDto.getRegNumber());
        }
        if (updateDto.getIncorporationDate() != null) {
            user.setIncorporationDate(updateDto.getIncorporationDate());
        }
        if (updateDto.getEmployees() != null) {
            user.setEmployees(updateDto.getEmployees());
        }
        if (updateDto.getComplianceCert() != null) {
            user.setComplianceCert(updateDto.getComplianceCert());
        }
        if (updateDto.getBankDetails() != null) {
            user.setBankDetails(updateDto.getBankDetails());
        }

        user = userRepository.save(user);
        log.info("Profile updated for user: {}", email);

        return mapToProfileDto(user);
    }

    /**
     * Upload company logo
     */
    @Transactional
    public String uploadLogo(String email, MultipartFile file) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete old logo if exists
        if (user.getLogoUrl() != null && !user.getLogoUrl().isEmpty()) {
            cloudinaryService.deleteCompanyLogo(user.getLogoUrl());
        }

        // Upload new logo
        String logoUrl = cloudinaryService.uploadCompanyLogo(file, user.getKraPin());
        
        user.setLogoUrl(logoUrl);
        userRepository.save(user);

        log.info("Logo uploaded for user: {}", email);
        return logoUrl;
    }

    /**
     * Delete company logo
     */
    @Transactional
    public void deleteLogo(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getLogoUrl() != null && !user.getLogoUrl().isEmpty()) {
            cloudinaryService.deleteCompanyLogo(user.getLogoUrl());
            user.setLogoUrl(null);
            userRepository.save(user);
            log.info("Logo deleted for user: {}", email);
        }
    }

    /**
     * Get profile completion percentage
     */
    public int getProfileCompletion(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getProfileCompletion();
    }

    /**
     * Update last login time
     */
    @Transactional
    public void updateLastLogin(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Map User entity to CompanyProfileDto
     */
    private CompanyProfileDto mapToProfileDto(User user) {
        return CompanyProfileDto.builder()
            .name(user.getCompany())
            .sector(user.getSector())
            .kraPin(user.getKraPin())
            .regNumber(user.getRegNumber())
            .email(user.getEmail())
            .phone(user.getPhone())
            .address(user.getAddress())
            .incorporationDate(user.getIncorporationDate())
            .employees(user.getEmployees())
            .logo(user.getLogoUrl())
            .complianceCert(user.getComplianceCert())
            .bankDetails(user.getBankDetails())
            .profileCompletion(user.getProfileCompletion())
            .build();
    }
}