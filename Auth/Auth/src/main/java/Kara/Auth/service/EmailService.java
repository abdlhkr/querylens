package Kara.Auth.service;

import Kara.Auth.entities.ConfType;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendVerificationCode(String toEmail, String code, ConfType type) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);

            String subject;
            String messageText;

            switch (type) {
                case REGISTER -> {
                    subject = "E-posta Adresinizi Doğrulayın";
                    messageText = "Kaydınızı tamamlamak için aşağıdaki kodu kullanın.";
                }
                case LOGIN -> {
                    subject = "Giriş Doğrulama Kodu";
                    messageText = "Hesabınıza giriş yapmak için aşağıdaki kodu kullanın.";
                }
                case SET_PASSWORD -> {
                    subject = "Şifrenizi Belirleyin";
                    messageText = "Hesabınıza şifre belirlemek için aşağıdaki kodu kullanın.";
                }
                case CHANGE_EMAIL -> {
                    subject = "E-posta Adresinizi Doğrulayın";
                    messageText = "E-posta adresinizi değiştirmek için aşağıdaki kodu kullanın.";
                }
                case FORGOT_PASSWORD -> {
                    subject = "Şifre Sıfırlama";
                    messageText = "Şifrenizi sıfırlamak için aşağıdaki kodu kullanın.";
                }
                default -> {
                    subject = "Doğrulama Kodu";
                    messageText = "Doğrulama kodunuz aşağıda yer almaktadır.";
                }
            }

            helper.setSubject(subject);
            helper.setText(buildHtml(code, messageText), true);
            mailSender.send(mimeMessage);
            log.info("Mail gönderildi: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Mail gönderilemedi → {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Mail gönderilemedi", e);
        }
    }

    private String buildHtml(String code, String message) {
        return """
                <!DOCTYPE html>
                <html lang="tr">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width,initial-scale=1.0">
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
                  </style>
                </head>
                <body style="margin:0;padding:0;background-color:#F5F0E8;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:48px 0;">
                    <tr>
                      <td align="center">
                        <table width="520" cellpadding="0" cellspacing="0"
                               style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
                          <tr>
                            <td align="center" style="padding:48px 48px 24px 48px;">
                              <h1 style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;letter-spacing:2px;">
                                <span style="color:#0F0F0F;">Query</span><span style="color:#B8932A;">Lens</span>
                              </h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 48px;">
                              <div style="height:1px;background-color:#EDE5D4;"></div>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:28px 48px 8px 48px;">
                              <p style="margin:0;font-size:15px;color:#555555;line-height:1.7;text-align:center;">%s</p>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:20px 48px 36px 48px;">
                              <table cellpadding="0" cellspacing="0">
                                <tr>
                                  <td align="center"
                                      style="background-color:#FBF4E3;border:2px solid #B8932A;border-radius:12px;padding:22px 44px;">
                                    <span style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:42px;font-weight:700;color:#0F0F0F;letter-spacing:14px;">%s</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 48px;">
                              <div style="height:1px;background-color:#EDE5D4;"></div>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:24px 48px 48px 48px;">
                              <p style="margin:0;font-size:12px;color:#AAAAAA;line-height:1.6;text-align:center;">
                                Bu kod 15 dakika geçerlidir.<br>
                                Eğer bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(message, code);
    }
}
