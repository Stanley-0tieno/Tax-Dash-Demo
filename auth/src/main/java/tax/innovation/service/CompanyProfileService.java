package tax.innovation.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tax.innovation.dto.CompanyProfileDto;
import tax.innovation.dto.UpdateProfileDto;
import tax.innovation.model.User;
import tax.innovation.repository.UserRepository;

import java.time.LocalDateTime;

@Service
public class CompanyProfileService {

    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    public CompanyProfileService(UserRepository userRepository, CloudinaryService cloudinaryService) {
        this.userRepository = userRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public CompanyProfileDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToProfileDto(user);
    }

    @Transactional
    public CompanyProfileDto updateProfile(String email, UpdateProfileDto updateDto) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (updateDto.getCompany() != null) user.setCompany(updateDto.getCompany());
        if (updateDto.getSector() != null) user.setSector(updateDto.getSector());
        if (updateDto.getPhone() != null) user.setPhone(updateDto.getPhone());
        if (updateDto.getEmail() != null && !updateDto.getEmail().equals(email)) {
            if (userRepository.existsByEmail(updateDto.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(updateDto.getEmail());
        }
        if (updateDto.getAddress() != null) user.setAddress(updateDto.getAddress());
        if (updateDto.getRegNumber() != null) user.setRegNumber(updateDto.getRegNumber());
        if (updateDto.getIncorporationDate() != null) user.setIncorporationDate(updateDto.getIncorporationDate());
        if (updateDto.getEmployees() != null) user.setEmployees(updateDto.getEmployees());
        if (updateDto.getComplianceCert() != null) user.setComplianceCert(updateDto.getComplianceCert());
        if (updateDto.getBankDetails() != null) user.setBankDetails(updateDto.getBankDetails());

        user = userRepository.save(user);
        System.out.println("Profile updated for user: " + email);
        return mapToProfileDto(user);
    }

    @Transactional
    public String uploadLogo(String email, MultipartFile file) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getLogoUrl() != null && !user.getLogoUrl().isEmpty()) {
            cloudinaryService.deleteCompanyLogo(user.getLogoUrl());
        }

        String logoUrl = cloudinaryService.uploadCompanyLogo(file, user.getKraPin());
        user.setLogoUrl(logoUrl);
        userRepository.save(user);

        System.out.println("Logo uploaded for user: " + email);
        return logoUrl;
    }

    @Transactional
    public void deleteLogo(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getLogoUrl() != null && !user.getLogoUrl().isEmpty()) {
            cloudinaryService.deleteCompanyLogo(user.getLogoUrl());
            user.setLogoUrl(null);
            userRepository.save(user);
            System.out.println("Logo deleted for user: " + email);
        }
    }

    public int getProfileCompletion(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getProfileCompletion();
    }

    @Transactional
    public void updateLastLogin(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

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
