import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import './PrivacyPolicy.css';

const CONTENT_EN = `
<h1>PRIVACY NOTICE</h1>
<p class="pp-date">Last updated May 25, 2026</p>

<p>This Privacy Notice for <strong>QueryLens</strong> ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:</p>
<ul>
  <li>Visit our website at <a href="https://querylensio.com/" target="_blank" rel="noopener noreferrer">https://querylensio.com/</a> or any website of ours that links to this Privacy Notice</li>
  <li>Engage with us in other related ways, including any marketing or events</li>
</ul>
<p><strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services.</p>

<hr/>

<h2>SUMMARY OF KEY POINTS</h2>
<p><strong><em>This summary provides key points from our Privacy Notice.</em></strong></p>
<p><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</p>
<p><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</p>
<p><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</p>
<p><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes only with your prior explicit consent.</p>
<p><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.</p>
<p><strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.</p>
<p><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</p>
<p><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by contacting us at <a href="mailto:info@querylensio.com">info@querylensio.com</a>. We will consider and act upon any request in accordance with applicable data protection laws.</p>

<hr/>

<h2 id="toc">TABLE OF CONTENTS</h2>
<ol>
  <li><a href="#infocollect">WHAT INFORMATION DO WE COLLECT?</a></li>
  <li><a href="#infouse">HOW DO WE PROCESS YOUR INFORMATION?</a></li>
  <li><a href="#legalbases">WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</a></li>
  <li><a href="#whoshare">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></li>
  <li><a href="#cookies">DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</a></li>
  <li><a href="#ai">DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</a></li>
  <li><a href="#sociallogins">HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a></li>
  <li><a href="#intltransfers">IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</a></li>
  <li><a href="#inforetain">HOW LONG DO WE KEEP YOUR INFORMATION?</a></li>
  <li><a href="#infosafe">HOW DO WE KEEP YOUR INFORMATION SAFE?</a></li>
  <li><a href="#infominors">DO WE COLLECT INFORMATION FROM MINORS?</a></li>
  <li><a href="#privacyrights">WHAT ARE YOUR PRIVACY RIGHTS?</a></li>
  <li><a href="#DNT">CONTROLS FOR DO-NOT-TRACK FEATURES</a></li>
  <li><a href="#uslaws">DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</a></li>
  <li><a href="#policyupdates">DO WE MAKE UPDATES TO THIS NOTICE?</a></li>
  <li><a href="#contact">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></li>
  <li><a href="#request">HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></li>
</ol>

<hr/>

<h2 id="infocollect">1. WHAT INFORMATION DO WE COLLECT?</h2>
<h3>Personal information you disclose to us</h3>
<p><strong><em>In Short: We collect personal information that you provide to us.</em></strong></p>
<p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
<p><strong>Personal Information Provided by You.</strong> The personal information we collect may include the following:</p>
<ul>
  <li>Names</li>
  <li>Phone numbers</li>
  <li>Email addresses</li>
  <li>Mailing addresses</li>
</ul>
<p><strong>Sensitive Information.</strong> We do not process sensitive information.</p>
<p><strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Google account. If you choose to register in this way, we will collect certain profile information about you from the social media provider, as described in the section <a href="#sociallogins">HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a> below.</p>
<p>All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</p>

<h3>Google API</h3>
<p>Our use of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" target="_blank" rel="noopener noreferrer">Limited Use requirements</a>.</p>

<hr/>

<h2 id="infouse">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
<p><strong><em>In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</em></strong></p>
<p>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>
<ul>
  <li><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.</li>
  <li><strong>To save or protect an individual's vital interest.</strong> We may process your information when necessary to save or protect an individual's vital interest, such as to prevent harm.</li>
</ul>

<hr/>

<h2 id="legalbases">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2>
<p><strong><em>In Short: We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable law, like with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill our legitimate business interests.</em></strong></p>

<p><strong><u>If you are located in the EU or UK, this section applies to you.</u></strong></p>
<p>The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. We may rely on the following legal bases:</p>
<ul>
  <li><strong>Consent.</strong> We may process your information if you have given us permission to use your personal information for a specific purpose. You can withdraw your consent at any time.</li>
  <li><strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights, or disclose your information as evidence in litigation in which we are involved.</li>
  <li><strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party, such as situations involving potential threats to the safety of any person.</li>
</ul>

<p><strong><u>If you are located in Canada, this section applies to you.</u></strong></p>
<p>We may process your information if you have given us specific permission (express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (implied consent). You can withdraw your consent at any time.</p>

<hr/>

<h2 id="whoshare">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
<p><strong><em>In Short: We may share information in specific situations described in this section and/or with the following third parties.</em></strong></p>
<p>We may need to share your personal information in the following situations:</p>
<ul>
  <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
</ul>

<hr/>

<h2 id="cookies">5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
<p><strong><em>In Short: We may use cookies and other tracking technologies to collect and store your information.</em></strong></p>
<p>We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.</p>
<p>We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests. The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.</p>
<p>Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.</p>

<hr/>

<h2 id="ai">6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2>
<p><strong><em>In Short: We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</em></strong></p>
<p>As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, "AI Products"). These tools are designed to enhance your experience and provide you with innovative solutions. The terms in this Privacy Notice govern your use of the AI Products within our Services.</p>
<p><strong>Use of AI Technologies</strong></p>
<p>We provide the AI Products through third-party service providers ("AI Service Providers"), including <strong>OpenAI</strong>. As outlined in this Privacy Notice, your input, output, and personal information will be shared with and processed by these AI Service Providers to enable your use of our AI Products. You must not use the AI Products in any way that violates the terms or policies of any AI Service Provider.</p>
<p><strong>Our AI Products</strong></p>
<p>Our AI Products are designed for the following functions:</p>
<ul>
  <li>Natural language processing</li>
</ul>
<p><strong>How We Process Your Data Using AI</strong></p>
<p>All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with third parties. This ensures high security and safeguards your personal information throughout the process.</p>

<hr/>

<h2 id="sociallogins">7. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2>
<p><strong><em>In Short: If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</em></strong></p>
<p>Our Services offer you the ability to register and log in using your third-party social media account details (like your Google login). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, and profile picture, as well as other information you choose to make public on such a social media platform.</p>
<p>We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information.</p>

<hr/>

<h2 id="intltransfers">8. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</h2>
<p><strong><em>In Short: We may transfer, store, and process your information in countries other than your own.</em></strong></p>
<p>Our servers are located in various regions. Regardless of your location, please be aware that your information may be transferred to, stored by, and processed by us in our facilities and in the facilities of the third parties with whom we may share your personal information (see <a href="#whoshare">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a> above), including facilities in other countries.</p>
<p>If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these countries may not necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all necessary measures to protect your personal information in accordance with this Privacy Notice and applicable law.</p>

<hr/>

<h2 id="inforetain">9. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
<p><strong><em>In Short: We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</em></strong></p>
<p>We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</p>
<p>When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.</p>

<hr/>

<h2 id="infosafe">10. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
<p><strong><em>In Short: We aim to protect your personal information through a system of organizational and technical security measures.</em></strong></p>
<p>We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.</p>

<hr/>

<h2 id="infominors">11. DO WE COLLECT INFORMATION FROM MINORS?</h2>
<p><strong><em>In Short: We do not knowingly collect data from or market to children under 18 years of age.</em></strong></p>
<p>We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a href="mailto:info@querylensio.com">info@querylensio.com</a>.</p>

<hr/>

<h2 id="privacyrights">12. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
<p><strong><em>In Short: Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.</em></strong></p>
<p>In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making. In certain circumstances, you may also have the right to object to the processing of your personal information. You can make such a request by contacting us using the contact details provided in the section <a href="#contact">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a> below.</p>
<p>We will consider and act upon any request in accordance with applicable data protection laws.</p>
<p>If you are located in the EEA or UK and you believe we are unlawfully processing your personal information, you also have the right to complain to your <a href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm" target="_blank" rel="noopener noreferrer">Member State data protection authority</a> or <a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/" target="_blank" rel="noopener noreferrer">UK data protection authority</a>.</p>
<p>If you are located in Switzerland, you may contact the <a href="https://www.edoeb.admin.ch/edoeb/en/home.html" target="_blank" rel="noopener noreferrer">Federal Data Protection and Information Commissioner</a>.</p>

<h3 id="withdrawconsent">Withdrawing your consent</h3>
<p>If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us using the contact details provided in the section <a href="#contact">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a> below.</p>
<p>However, please note that this will not affect the lawfulness of the processing before its withdrawal nor will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.</p>

<h3>Account Information</h3>
<p>If you would at any time like to review or change the information in your account or terminate your account, you can log in to your account settings and update your user account.</p>
<p>Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</p>
<p><strong><u>Cookies and similar technologies:</u></strong> Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Services.</p>

<hr/>

<h2 id="DNT">13. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
<p>Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.</p>
<p>California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.</p>

<hr/>

<h2 id="uslaws">14. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
<p><strong><em>In Short: If you are a resident of certain US states, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law.</em></strong></p>

<h3>Categories of Personal Information We Collect</h3>
<p>The table below shows the categories of personal information we have collected in the past twelve (12) months:</p>
<table class="pp-table">
  <thead>
    <tr><th>Category</th><th>Examples</th><th>Collected</th></tr>
  </thead>
  <tbody>
    <tr><td>A. Identifiers</td><td>Contact details, such as real name, postal address, telephone or mobile contact number, unique personal identifier, online identifier, Internet Protocol address, email address, and account name</td><td>NO</td></tr>
    <tr><td>B. Protected classification characteristics under state or federal law</td><td>Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data</td><td>NO</td></tr>
    <tr><td>C. Commercial information</td><td>Transaction information, purchase history, financial details, and payment information</td><td>NO</td></tr>
    <tr><td>D. Biometric information</td><td>Fingerprints and voiceprints</td><td>NO</td></tr>
    <tr><td>E. Internet or other similar network activity</td><td>Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements</td><td>NO</td></tr>
    <tr><td>F. Geolocation data</td><td>Device location</td><td>NO</td></tr>
    <tr><td>G. Audio, electronic, sensory, or similar information</td><td>Images and audio, video or call recordings created in connection with our business activities</td><td>NO</td></tr>
    <tr><td>H. Professional or employment-related information</td><td>Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us</td><td>NO</td></tr>
    <tr><td>I. Education Information</td><td>Student records and directory information</td><td>NO</td></tr>
    <tr><td>J. Inferences drawn from collected personal information</td><td>Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual's preferences and characteristics</td><td>NO</td></tr>
    <tr><td>K. Sensitive personal Information</td><td>—</td><td>NO</td></tr>
  </tbody>
</table>

<p>We may also collect other personal information outside of these categories through instances where you interact with us in person, online, or by phone or mail in the context of:</p>
<ul>
  <li>Receiving help through our customer support channels;</li>
  <li>Participation in customer surveys or contests; and</li>
  <li>Facilitation in the delivery of our Services and to respond to your inquiries.</li>
</ul>

<h3>Your Rights</h3>
<p>You have rights under certain US state data protection laws. However, these rights are not absolute, and in certain cases, we may decline your request as permitted by law. These rights include:</p>
<ul>
  <li><strong>Right to know</strong> whether or not we are processing your personal data</li>
  <li><strong>Right to access</strong> your personal data</li>
  <li><strong>Right to correct</strong> inaccuracies in your personal data</li>
  <li><strong>Right to request</strong> the deletion of your personal data</li>
  <li><strong>Right to obtain a copy</strong> of the personal data you previously shared with us</li>
  <li><strong>Right to non-discrimination</strong> for exercising your rights</li>
  <li><strong>Right to opt out</strong> of the processing of your personal data if it is used for targeted advertising, the sale of personal data, or profiling in furtherance of decisions that produce legal or similarly significant effects</li>
</ul>

<h3>How to Exercise Your Rights</h3>
<p>To exercise these rights, you can contact us by emailing us at <a href="mailto:info@querylensio.com">info@querylensio.com</a>, or by referring to the contact details at the bottom of this document.</p>
<p>Under certain US state data protection laws, you can designate an authorized agent to make a request on your behalf. We may deny a request from an authorized agent that does not submit proof that they have been validly authorized to act on your behalf in accordance with applicable laws.</p>

<h3>Request Verification</h3>
<p>Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. We will only use personal information provided in your request to verify your identity or authority to make the request. However, if we cannot verify your identity from the information already maintained by us, we may request that you provide additional information for the purposes of verifying your identity and for security or fraud-prevention purposes.</p>
<p>If you submit the request through an authorized agent, we may need to collect additional information to verify your identity before processing your request and the agent will need to provide a written and signed permission from you to submit such request on your behalf.</p>

<hr/>

<h2 id="policyupdates">15. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
<p><strong><em>In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.</em></strong></p>
<p>We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.</p>

<hr/>

<h2 id="contact">16. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
<p>If you have questions or comments about this notice, you may contact us by post at:</p>
<p><strong>QueryLens</strong><br/>
<a href="mailto:info@querylensio.com">info@querylensio.com</a></p>

<hr/>

<h2 id="request">17. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
<p>Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please contact us at <a href="mailto:info@querylensio.com">info@querylensio.com</a>.</p>
`;

const CONTENT_TR = `
<h1>GİZLİLİK BİLDİRİMİ</h1>
<p class="pp-date">Son güncelleme: 25 Mayıs 2026</p>

<p>Bu Gizlilik Bildirimi, <strong>QueryLens</strong> ("biz", "bizi" veya "bizim") için geçerlidir ve Hizmetlerimizi ("Hizmetler") kullandığınızda kişisel bilgilerinize nasıl eriştiğimizi, topladığımızı, sakladığımızı, kullandığımızı ve/veya paylaştığımızı ("işlediğimizi") açıklar. Buna şu durumlar dahildir:</p>
<ul>
  <li><a href="https://querylensio.com/" target="_blank" rel="noopener noreferrer">https://querylensio.com/</a> adresindeki web sitemizi veya bu Gizlilik Bildirimine bağlantı veren herhangi bir web sitemizi ziyaret ettiğinizde</li>
  <li>Pazarlama veya etkinlikler dahil olmak üzere bizimle başka şekillerde etkileşime geçtiğinizde</li>
</ul>
<p><strong>Sorularınız veya endişeleriniz mi var?</strong> Bu Gizlilik Bildirimi'ni okumak, gizlilik haklarınızı ve seçeneklerinizi anlamanıza yardımcı olacaktır. Kişisel bilgilerinizin nasıl işleneceğine dair kararlardan biz sorumluyuz. Politikalarımız ve uygulamalarımıza katılmıyorsanız lütfen Hizmetlerimizi kullanmayın.</p>

<hr/>

<h2>TEMEL NOKTALARIN ÖZETİ</h2>
<p><strong><em>Bu özet, Gizlilik Bildirimizden temel noktaları sağlamaktadır.</em></strong></p>
<p><strong>Hangi kişisel bilgileri işliyoruz?</strong> Hizmetlerimizi ziyaret ettiğinizde, kullandığınızda veya gezindiğinizde, bizimle nasıl etkileşime geçtiğinize, yaptığınız seçimlere ve kullandığınız ürün ve özelliklere bağlı olarak kişisel bilgileri işleyebiliriz.</p>
<p><strong>Hassas kişisel bilgileri işliyor muyuz?</strong> Hassas kişisel bilgileri işlemiyoruz.</p>
<p><strong>Üçüncü taraflardan herhangi bir bilgi topluyor muyuz?</strong> Üçüncü taraflardan herhangi bir bilgi toplamıyoruz.</p>
<p><strong>Bilgilerinizi nasıl işliyoruz?</strong> Bilgilerinizi Hizmetlerimizi sağlamak, iyileştirmek ve yönetmek, sizinle iletişim kurmak, güvenlik ve dolandırıcılık önleme amacıyla ve yasalara uymak için işliyoruz. Ayrıca bilgilerinizi yalnızca açık önceden onayınızla başka amaçlar için de işleyebiliriz.</p>
<p><strong>Kişisel bilgilerinizi kim ile ve hangi durumlarda paylaşıyoruz?</strong> Belirli durumlarda ve belirli üçüncü taraflarla bilgi paylaşabiliriz.</p>
<p><strong>Bilgilerinizi nasıl güvende tutuyoruz?</strong> Kişisel bilgilerinizi korumak için yeterli organizasyonel ve teknik süreçler ile prosedürler uygulamaktayız. Ancak internet üzerinden hiçbir elektronik iletim veya bilgi depolama teknolojisi %100 güvenli olduğu garanti edilemez.</p>
<p><strong>Haklarınız nelerdir?</strong> Bulunduğunuz coğrafi konuma bağlı olarak, geçerli gizlilik yasası, kişisel bilgilerinizle ilgili belirli haklara sahip olduğunuz anlamına gelebilir.</p>
<p><strong>Haklarınızı nasıl kullanırsınız?</strong> Haklarınızı kullanmanın en kolay yolu <a href="mailto:info@querylensio.com">info@querylensio.com</a> adresinden bizimle iletişime geçmektir. Geçerli veri koruma yasalarına uygun olarak tüm talepleri değerlendirir ve üzerine hareket ederiz.</p>

<hr/>

<h2 id="toc">İÇİNDEKİLER TABLOSU</h2>
<ol>
  <li><a href="#infocollect">HANGİ BİLGİLERİ TOPLUYORUZ?</a></li>
  <li><a href="#infouse">BİLGİLERİNİZİ NASIL İŞLİYORUZ?</a></li>
  <li><a href="#legalbases">KİŞİSEL BİLGİLERİNİZİ İŞLEMEK İÇİN HANGİ HUKUKİ DAYANAĞA DAYANIYORUZ?</a></li>
  <li><a href="#whoshare">KİŞİSEL BİLGİLERİNİZİ NE ZAMAN VE KİMLE PAYLAŞIYORUZ?</a></li>
  <li><a href="#cookies">ÇEREZ VE DİĞER TAKİP TEKNOLOJİLERİNİ KULLANIYOR MUYUZ?</a></li>
  <li><a href="#ai">YAPAY ZEKA TABANLI ÜRÜNLER SUNUYOR MUYUZ?</a></li>
  <li><a href="#sociallogins">SOSYAL MEDYA GİRİŞLERİNİZİ NASIL ELE ALIYORUZ?</a></li>
  <li><a href="#intltransfers">BİLGİLERİNİZ ULUSLARARASI OLARAK AKTARILIYOR MU?</a></li>
  <li><a href="#inforetain">BİLGİLERİNİZİ NE KADAR SÜRE TUTUYORUZ?</a></li>
  <li><a href="#infosafe">BİLGİLERİNİZİ NASIL GÜVENLİ TUTUYORUZ?</a></li>
  <li><a href="#infominors">KÜÇÜKLERDEN BİLGİ TOPLUYOR MUYUZ?</a></li>
  <li><a href="#privacyrights">GİZLİLİK HAKLARINIZ NELERDİR?</a></li>
  <li><a href="#DNT">İZLEMEME (DO-NOT-TRACK) ÖZELLİKLERİ İÇİN KONTROLLER</a></li>
  <li><a href="#uslaws">ABD'DE YAŞAYAN KİŞİLERİN ÖZEL GİZLİLİK HAKLARI VAR MI?</a></li>
  <li><a href="#policyupdates">BU BİLDİRİMİ GÜNCELLEME YAPACAK MIYIZ?</a></li>
  <li><a href="#contact">BU BİLDİRİM HAKKINDA BİZİMLE NASIL İLETİŞİME GEÇEBİLİRSİNİZ?</a></li>
  <li><a href="#request">HAKKINIZDAKI VERİLERİ NASIL İNCELEYEBİLİR, GÜNCELLEYEBİLİR VEYA SİLEBİLİRSİNİZ?</a></li>
</ol>

<hr/>

<h2 id="infocollect">1. HANGİ BİLGİLERİ TOPLUYORUZ?</h2>
<h3>Bize ilettiğiniz kişisel bilgiler</h3>
<p><strong><em>Kısaca: Bize sağladığınız kişisel bilgileri topluyoruz.</em></strong></p>
<p>Hizmetlere kayıt olduğunuzda, ürünlerimiz veya Hizmetlerimiz hakkında bilgi edinmek istediğinizi ifade ettiğinizde, Hizmetlerdeki etkinliklere katıldığınızda veya başka şekillerde bizimle iletişime geçtiğinizde bize gönüllü olarak sağladığınız kişisel bilgileri topluyoruz.</p>
<p><strong>Sizin tarafınızdan sağlanan kişisel bilgiler.</strong> Topladığımız kişisel bilgiler aşağıdakileri içerebilir:</p>
<ul>
  <li>İsimler</li>
  <li>Telefon numaraları</li>
  <li>E-posta adresleri</li>
  <li>Posta adresleri</li>
</ul>
<p><strong>Hassas Bilgiler.</strong> Hassas bilgileri işlemiyoruz.</p>
<p><strong>Sosyal Medya Giriş Verileri.</strong> Size mevcut sosyal medya hesap bilgilerinizi (Google hesabınız gibi) kullanarak kayıt olma seçeneği sunabiliriz. Bu şekilde kayıt olmayı seçerseniz, sosyal medya sağlayıcısından belirli profil bilgilerini toplayacağız. Daha fazla ayrıntı için <a href="#sociallogins">SOSYAL MEDYA GİRİŞLERİNİZİ NASIL ELE ALIYORUZ?</a> bölümüne bakın.</p>
<p>Bize sağladığınız tüm kişisel bilgilerin doğru, eksiksiz ve güncel olması gerekmekte olup bu bilgilerdeki değişiklikleri bize bildirmeniz gerekmektedir.</p>

<h3>Google API</h3>
<p>Google API'lerinden alınan bilgilerin kullanımımız, <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Hizmetleri Kullanıcı Verileri Politikası</a>'na ve <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" target="_blank" rel="noopener noreferrer">Sınırlı Kullanım gereksinimleri</a>ne uyacaktır.</p>

<hr/>

<h2 id="infouse">2. BİLGİLERİNİZİ NASIL İŞLİYORUZ?</h2>
<p><strong><em>Kısaca: Bilgilerinizi Hizmetlerimizi sağlamak, iyileştirmek ve yönetmek, sizinle iletişim kurmak, güvenlik ve dolandırıcılık önleme amacıyla ve yasalara uymak için işliyoruz.</em></strong></p>
<p>Hizmetlerimizle nasıl etkileşim kurduğunuza bağlı olarak kişisel bilgilerinizi çeşitli amaçlarla işliyoruz:</p>
<ul>
  <li><strong>Hesap oluşturma ve kimlik doğrulama için.</strong> Hesabınızı oluşturabilmeniz ve giriş yapabilmeniz için bilgilerinizi işleyebiliriz.</li>
  <li><strong>Bir bireyin hayati çıkarını korumak için.</strong> Bir kişiyi zarardan korumak gibi hayati çıkarları korumak için gerekli olduğunda bilgilerinizi işleyebiliriz.</li>
</ul>

<hr/>

<h2 id="legalbases">3. KİŞİSEL BİLGİLERİNİZİ İŞLEMEK İÇİN HANGİ HUKUKİ DAYANAĞA DAYANIYORUZ?</h2>
<p><strong><em>Kısaca: Kişisel bilgilerinizi yalnızca gerekli olduğunda ve geçerli bir yasal dayanağımız olduğunda işliyoruz.</em></strong></p>

<p><strong><u>AB veya Birleşik Krallık'ta bulunuyorsanız bu bölüm sizin için geçerlidir.</u></strong></p>
<p>Genel Veri Koruma Yönetmeliği (GDPR) ve Birleşik Krallık GDPR, kişisel bilgilerinizi işlemek için dayandığımız geçerli yasal dayanakları açıklamamızı gerektirmektedir. Aşağıdaki yasal dayanakları kullanabiliriz:</p>
<ul>
  <li><strong>Rıza.</strong> Belirli bir amaç için kişisel bilgilerinizi kullanmamıza izin verirseniz, bu durumda bilgilerinizi işleyebiliriz. Rızanızı istediğiniz zaman geri çekebilirsiniz.</li>
  <li><strong>Yasal Yükümlülükler.</strong> Yasal yükümlülüklerimize uymak için gerekli olduğunda bilgilerinizi işleyebiliriz.</li>
  <li><strong>Hayati Çıkarlar.</strong> Sizin veya üçüncü bir tarafın hayati çıkarlarını korumak için gerekli olduğunda bilgilerinizi işleyebiliriz.</li>
</ul>

<p><strong><u>Kanada'da bulunuyorsanız bu bölüm sizin için geçerlidir.</u></strong></p>
<p>Belirli bir amaç için kişisel bilgilerinizi kullanmamıza açık izin verirseniz veya izninizin ima edilebileceği durumlarda bilgilerinizi işleyebiliriz. Rızanızı istediğiniz zaman geri çekebilirsiniz.</p>

<hr/>

<h2 id="whoshare">4. KİŞİSEL BİLGİLERİNİZİ NE ZAMAN VE KİMLE PAYLAŞIYORUZ?</h2>
<p><strong><em>Kısaca: Belirli durumlarda ve aşağıdaki üçüncü taraflarla bilgi paylaşabiliriz.</em></strong></p>
<p>Kişisel bilgilerinizi aşağıdaki durumlarda paylaşmamız gerekebilir:</p>
<ul>
  <li><strong>İş Devirleri.</strong> Herhangi bir birleşme, şirket varlıklarının satışı, finansman veya işimizin tamamının veya bir bölümünün başka bir şirkete satın alınması müzakerelerinde bilgilerinizi paylaşabilir veya aktarabiliriz.</li>
</ul>

<hr/>

<h2 id="cookies">5. ÇEREZ VE DİĞER TAKİP TEKNOLOJİLERİNİ KULLANIYOR MUYUZ?</h2>
<p><strong><em>Kısaca: Bilgilerinizi toplamak ve saklamak için çerezler ve diğer takip teknolojilerini kullanabiliriz.</em></strong></p>
<p>Hizmetlerimizle etkileşime geçtiğinizde bilgi toplamak için çerezler ve benzer takip teknolojilerini (web işaretçileri ve pikseller gibi) kullanabiliriz. Bazı çevrimiçi takip teknolojileri Hizmetlerimizin ve hesabınızın güvenliğini korumamıza, çökmeleri önlememize, hataları düzeltmemize, tercihlerinizi kaydetmemize ve temel site işlevlerine yardımcı olmamıza yardımcı olur.</p>
<p>Ayrıca üçüncü tarafların ve hizmet sağlayıcıların, reklamları yönetmeye ve görüntülemeye, reklamları ilgi alanlarınıza göre uyarlamaya yardımcı olmak dahil olmak üzere analitik ve reklam amacıyla Hizmetlerimizde çevrimiçi takip teknolojilerini kullanmasına izin veriyoruz.</p>
<p>Bu teknolojileri nasıl kullandığımız ve belirli çerezleri nasıl reddedebileceğiniz hakkında ayrıntılı bilgi Çerez Bildirimizde yer almaktadır.</p>

<hr/>

<h2 id="ai">6. YAPAY ZEKA TABANLI ÜRÜNLER SUNUYOR MUYUZ?</h2>
<p><strong><em>Kısaca: Yapay zeka, makine öğrenimi veya benzer teknolojilerle desteklenen ürünler, özellikler veya araçlar sunuyoruz.</em></strong></p>
<p>Hizmetlerimizin bir parçası olarak, yapay zeka, makine öğrenimi veya benzer teknolojilerle desteklenen ürünler, özellikler veya araçlar (toplu olarak "YZ Ürünleri") sunuyoruz. Bu araçlar, deneyiminizi geliştirmek ve size yenilikçi çözümler sunmak için tasarlanmıştır.</p>
<p><strong>YZ Teknolojilerinin Kullanımı</strong></p>
<p>YZ Ürünlerini, <strong>OpenAI</strong> dahil olmak üzere üçüncü taraf hizmet sağlayıcılar ("YZ Hizmet Sağlayıcıları") aracılığıyla sunuyoruz. Girdiniz, çıktınız ve kişisel bilgileriniz, YZ Ürünlerimizi kullanımınızı etkinleştirmek amacıyla bu YZ Hizmet Sağlayıcılarıyla paylaşılacak ve işlenecektir. YZ Ürünlerini herhangi bir YZ Hizmet Sağlayıcısının koşullarını veya politikalarını ihlal edecek şekilde kullanmamalısınız.</p>
<p><strong>YZ Ürünlerimiz</strong></p>
<p>YZ Ürünlerimiz aşağıdaki işlevler için tasarlanmıştır:</p>
<ul>
  <li>Doğal dil işleme</li>
</ul>
<p><strong>YZ Kullanarak Verilerinizi Nasıl İşliyoruz</strong></p>
<p>YZ Ürünlerimiz kullanılarak işlenen tüm kişisel bilgiler, Gizlilik Bildirimiz ve üçüncü taraflarla yaptığımız anlaşmalar doğrultusunda işlenmektedir. Bu, süreç boyunca kişisel bilgilerinizin yüksek güvenlik ve korumayla ele alınmasını sağlar.</p>

<hr/>

<h2 id="sociallogins">7. SOSYAL MEDYA GİRİŞLERİNİZİ NASIL ELE ALIYORUZ?</h2>
<p><strong><em>Kısaca: Hizmetlerimize kaydolmak veya giriş yapmak için bir sosyal medya hesabı kullanmayı seçerseniz, hakkınızda belirli bilgilere erişimimiz olabilir.</em></strong></p>
<p>Hizmetlerimiz, üçüncü taraf sosyal medya hesap bilgilerinizi (Google girişiniz gibi) kullanarak kaydolma ve giriş yapma olanağı sunmaktadır. Bunu yapmayı seçtiğinizde, sosyal medya sağlayıcısından hakkınızda belirli profil bilgileri alacağız. Alınan profil bilgileri sosyal medya sağlayıcısına bağlı olarak değişebilir ancak genellikle adınızı, e-posta adresinizi ve profil fotoğrafınızı içerecektir.</p>
<p>Aldığımız bilgileri yalnızca bu Gizlilik Bildiriminde açıklanan amaçlar için veya ilgili Hizmetlerde size açıkça belirtilen amaçlar için kullanacağız. Üçüncü taraf sosyal medya sağlayıcınızın kişisel bilgilerinizi başka şekillerde kullanmasını kontrol etmediğimizi ve bundan sorumlu olmadığımızı lütfen unutmayın.</p>

<hr/>

<h2 id="intltransfers">8. BİLGİLERİNİZ ULUSLARARASI OLARAK AKTARILIYOR MU?</h2>
<p><strong><em>Kısaca: Bilgilerinizi kendi ülkenizin dışındaki ülkelere aktarabilir, saklayabilir ve işleyebiliriz.</em></strong></p>
<p>Sunucularımız çeşitli bölgelerde bulunmaktadır. Konumunuzdan bağımsız olarak, bilgilerinizin tesislerimize ve kişisel bilgilerinizi paylaşabileceğimiz üçüncü tarafların tesislerine aktarılabileceğini, orada saklanabileceğini ve işlenebileceğini lütfen unutmayın (yukarıdaki <a href="#whoshare">KİŞİSEL BİLGİLERİNİZİ NE ZAMAN VE KİMLE PAYLAŞIYORUZ?</a> bölümüne bakın).</p>
<p>Avrupa Ekonomik Alanı (AEA), Birleşik Krallık (BK) veya İsviçre'de ikamet ediyorsanız, bu ülkeler sizin ülkenizle aynı kapsamlı veri koruma yasalarına sahip olmayabilir. Ancak, kişisel bilgilerinizi bu Gizlilik Bildirimi ve geçerli hukuka uygun olarak korumak için gerekli tüm önlemleri alacağız.</p>

<hr/>

<h2 id="inforetain">9. BİLGİLERİNİZİ NE KADAR SÜRE TUTUYORUZ?</h2>
<p><strong><em>Kısaca: Bilgilerinizi bu Gizlilik Bildiriminde belirtilen amaçları yerine getirmek için gerekli olduğu sürece, aksi yasal olarak gerekmedikçe, saklıyoruz.</em></strong></p>
<p>Kişisel bilgilerinizi yalnızca bu Gizlilik Bildiriminde belirtilen amaçlar için gerekli olduğu sürece saklayacağız; hukuki gerekliliklerin daha uzun bir saklama süresi gerektirdiği veya buna izin verdiği durumlar hariç. Bu bildirimde belirtilen hiçbir amaç, kişisel bilgilerinizi hesabınızın aktif olduğu süreden daha uzun süre saklamamızı gerektirmeyecektir.</p>
<p>Kişisel bilgilerinizi işlemeye devam etmemiz için meşru bir iş ihtiyacımız kalmadığında, bilgilerinizi ya sileceğiz ya da anonimleştireceğiz veya bu mümkün değilse (örneğin, kişisel bilgileriniz yedek arşivlerde saklandığı için), kişisel bilgilerinizi güvenli şekilde saklayacak ve silinmesi mümkün olana kadar bunları daha fazla işlemekten izole edeceğiz.</p>

<hr/>

<h2 id="infosafe">10. BİLGİLERİNİZİ NASIL GÜVENLİ TUTUYORUZ?</h2>
<p><strong><em>Kısaca: Kişisel bilgilerinizi organizasyonel ve teknik güvenlik önlemleri aracılığıyla korumayı amaçlıyoruz.</em></strong></p>
<p>İşlediğimiz kişisel bilgilerin güvenliğini korumak için tasarlanmış uygun ve makul teknik ve organizasyonel güvenlik önlemleri uyguladık. Ancak, güvencelerimize ve bilgilerinizi güvence altına alma çabalarımıza rağmen, İnternet üzerinden hiçbir elektronik iletim veya bilgi depolama teknolojisi %100 güvenli olduğu garanti edilemez. Bu nedenle, bilgisayar korsanlarının, siber suçluların veya diğer yetkisiz üçüncü tarafların güvenliğimizi aşamayacaklarını ve bilgilerinizi haksız yere toplayamayacaklarını, erişemeyeceklerini, çalamayacaklarını veya değiştiremeyeceklerini vaat edemez veya garanti edemeyiz. Kişisel bilgilerinizi korumak için elimizden geleni yapacak olsak da, Hizmetlerimize ve Hizmetlerimizden kişisel bilgi iletimi tamamen size aittir. Hizmetlere yalnızca güvenli bir ortamda erişmelisiniz.</p>

<hr/>

<h2 id="infominors">11. KÜÇÜKLERDEN BİLGİ TOPLUYOR MUYUZ?</h2>
<p><strong><em>Kısaca: 18 yaşın altındaki çocuklara yönelik bilerek veri toplamıyor veya pazarlama yapmıyoruz.</em></strong></p>
<p>18 yaşın altındaki çocuklardan bilerek veri toplamıyoruz, talep etmiyoruz veya onlara pazarlama yapmıyoruz. Hizmetleri kullanarak, en az 18 yaşında olduğunuzu veya küçük bir bağımlının ebeveyni ya da vasisi olduğunuzu ve bu tür küçük bağımlının Hizmetleri kullanmasına izin verdiğinizi beyan etmiş olursunuz. 18 yaşın altındaki kullanıcılara ait kişisel bilgilerin toplandığını öğrenirsek, hesabı devre dışı bırakacak ve bu tür verileri kayıtlarımızdan derhal silmek için makul önlemler alacağız. 18 yaşın altındaki çocuklardan toplamış olabileceğimiz verilerden haberdar olursanız, lütfen <a href="mailto:info@querylensio.com">info@querylensio.com</a> adresinden bizimle iletişime geçin.</p>

<hr/>

<h2 id="privacyrights">12. GİZLİLİK HAKLARINIZ NELERDİR?</h2>
<p><strong><em>Kısaca: ABD'deki eyaletinize veya Avrupa Ekonomik Alanı (AEA), Birleşik Krallık (BK), İsviçre ve Kanada gibi bazı bölgelerdeki konumunuza bağlı olarak, kişisel bilgileriniz üzerinde daha fazla erişim ve kontrol sağlayan haklara sahip olabilirsiniz.</em></strong></p>
<p>Bazı bölgelerde (AEA, BK, İsviçre ve Kanada gibi) geçerli veri koruma yasaları kapsamında belirli haklara sahipsiniz. Bunlar arasında şu haklar yer alabilir: (i) kişisel bilgilerinize erişim talep etme ve bir kopyasını alma hakkı, (ii) düzeltme veya silme talep etme hakkı, (iii) kişisel bilgilerinizin işlenmesini kısıtlama hakkı, (iv) uygun olduğu durumlarda veri taşınabilirliği hakkı ve (v) otomatik karar alma süreçlerine tabi tutulmama hakkı. Belirli durumlarda kişisel bilgilerinizin işlenmesine itiraz etme hakkına da sahip olabilirsiniz. Bu talebi, aşağıdaki <a href="#contact">BU BİLDİRİM HAKKINDA BİZİMLE NASIL İLETİŞİME GEÇEBİLİRSİNİZ?</a> bölümünde verilen iletişim bilgilerini kullanarak yapabilirsiniz.</p>
<p>AEA veya BK'da bulunuyorsanız ve kişisel bilgilerinizi yasadışı şekilde işlediğimize inanıyorsanız, <a href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm" target="_blank" rel="noopener noreferrer">Üye Devlet veri koruma otoritesi</a>na veya <a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/" target="_blank" rel="noopener noreferrer">Birleşik Krallık veri koruma otoritesi</a>ne şikayette bulunma hakkına da sahipsiniz.</p>
<p>İsviçre'de bulunuyorsanız, <a href="https://www.edoeb.admin.ch/edoeb/en/home.html" target="_blank" rel="noopener noreferrer">Federal Veri Koruma ve Bilgi Komiseri</a> ile iletişime geçebilirsiniz.</p>

<h3 id="withdrawconsent">Rızanızı geri çekme</h3>
<p>Kişisel bilgilerinizi işlemek için rızanıza dayanıyorsak, rızanızı istediğiniz zaman geri çekme hakkına sahipsiniz. Bunu, aşağıdaki <a href="#contact">BU BİLDİRİM HAKKINDA BİZİMLE NASIL İLETİŞİME GEÇEBİLİRSİNİZ?</a> bölümünde verilen iletişim bilgilerini kullanarak yapabilirsiniz.</p>
<p>Ancak bu, geri çekmeden önce yapılan işlemin hukukiliğini etkilemeyecektir.</p>

<h3>Hesap Bilgileri</h3>
<p>Hesabınızdaki bilgileri herhangi bir zamanda incelemek veya değiştirmek ya da hesabınızı sonlandırmak istiyorsanız, hesap ayarlarınıza giriş yapabilir ve kullanıcı hesabınızı güncelleyebilirsiniz.</p>
<p>Hesabınızı sonlandırma talebinizde bulunmanız üzerine, hesabınızı ve bilgilerinizi aktif veritabanlarımızdan devre dışı bırakacak veya sileceğiz. Ancak dolandırıcılığı önlemek, sorunları gidermek, soruşturmalara yardımcı olmak, yasal şartlarımızı uygulamak ve/veya geçerli yasal gerekliliklere uymak için dosyalarımızda bazı bilgileri saklayabiliriz.</p>
<p><strong><u>Çerezler ve benzer teknolojiler:</u></strong> Çoğu Web tarayıcısı varsayılan olarak çerezleri kabul edecek şekilde ayarlanmıştır. Tercih ederseniz, genellikle tarayıcınızı çerezleri kaldıracak ve reddedecek şekilde ayarlayabilirsiniz. Çerezleri kaldırmayı veya reddetmeyi seçerseniz, bu Hizmetlerimizin belirli özellik veya hizmetlerini etkileyebilir.</p>

<hr/>

<h2 id="DNT">13. İZLEMEME (DO-NOT-TRACK) ÖZELLİKLERİ İÇİN KONTROLLER</h2>
<p>Çoğu web tarayıcısı ve bazı mobil işletim sistemleri ve mobil uygulamalar, çevrimiçi tarama etkinlikleriniz hakkındaki verilerin izlenmesini ve toplanmasını istemediğinizi belirtmek için etkinleştirebileceğiniz bir İzlememe ("DNT") özelliği veya ayarı içerir. Şu aşamada, DNT sinyallerini tanıma ve uygulama konusunda herhangi bir endüstri teknoloji standardı belirlenmemiştir. Bu nedenle, şu an için DNT tarayıcı sinyallerine veya sizi çevrimiçi olarak izlememe tercihinizi otomatik olarak iletmesi gereken başka herhangi bir mekanizmaya yanıt vermiyoruz. Gelecekte uymamız gereken çevrimiçi izleme için bir standart kabul edilirse, bu uygulamayı Gizlilik Bildiriminin revize edilmiş bir versiyonunda size bildireceğiz.</p>
<p>Kaliforniya yasası, web tarayıcısı DNT sinyallerine nasıl yanıt verdiğimizi size bildirmemizi gerektirmektedir. DNT sinyallerini tanıma veya bunlara uyma konusunda endüstri veya yasal bir standart bulunmadığından, şu an için bunlara yanıt vermiyoruz.</p>

<hr/>

<h2 id="uslaws">14. ABD'DE YAŞAYAN KİŞİLERİN ÖZEL GİZLİLİK HAKLARI VAR MI?</h2>
<p><strong><em>Kısaca: Belirli ABD eyaletlerinde ikamet ediyorsanız, hakkınızda tuttuğumuz kişisel bilgilere erişim talep etme ve bunların ayrıntılarını alma, hataları düzeltme, bir kopyasını edinme veya silme hakkına sahip olabilirsiniz.</em></strong></p>

<h3>Topladığımız Kişisel Bilgi Kategorileri</h3>
<p>Aşağıdaki tablo, son on iki (12) ay içinde topladığımız kişisel bilgi kategorilerini göstermektedir:</p>
<table class="pp-table">
  <thead>
    <tr><th>Kategori</th><th>Örnekler</th><th>Toplandı mı</th></tr>
  </thead>
  <tbody>
    <tr><td>A. Kimlik Bilgileri</td><td>Gerçek isim, takma ad, posta adresi, telefon numarası, benzersiz kişisel tanımlayıcı, çevrimiçi tanımlayıcı, İnternet Protokol adresi, e-posta adresi ve hesap adı gibi iletişim bilgileri</td><td>HAYIR</td></tr>
    <tr><td>B. Eyalet veya federal yasa kapsamındaki korunan sınıflandırma özellikleri</td><td>Cinsiyet, yaş, doğum tarihi, ırk ve etnik köken, milliyet, medeni durum ve diğer demografik veriler</td><td>HAYIR</td></tr>
    <tr><td>C. Ticari bilgiler</td><td>İşlem bilgileri, satın alma geçmişi, finansal ayrıntılar ve ödeme bilgileri</td><td>HAYIR</td></tr>
    <tr><td>D. Biyometrik bilgiler</td><td>Parmak izleri ve ses izleri</td><td>HAYIR</td></tr>
    <tr><td>E. İnternet veya diğer benzer ağ etkinliği</td><td>Tarama geçmişi, arama geçmişi, çevrimiçi davranış, ilgi verileri ve web siteleri, uygulamalar, sistemler ve reklamlarla etkileşimler</td><td>HAYIR</td></tr>
    <tr><td>F. Coğrafi konum verileri</td><td>Cihaz konumu</td><td>HAYIR</td></tr>
    <tr><td>G. Ses, elektronik, duyusal veya benzer bilgiler</td><td>İş faaliyetlerimizle bağlantılı olarak oluşturulan görüntüler ve ses, video veya çağrı kayıtları</td><td>HAYIR</td></tr>
    <tr><td>H. Mesleki veya istihdamla ilgili bilgiler</td><td>İş düzeyinde Hizmetlerimizi sunmak için iş iletişim bilgileri veya iş unvanı, çalışma geçmişi ve mesleki nitelikler</td><td>HAYIR</td></tr>
    <tr><td>I. Eğitim Bilgileri</td><td>Öğrenci kayıtları ve rehber bilgileri</td><td>HAYIR</td></tr>
    <tr><td>J. Toplanan kişisel bilgilerden çıkarılan çıkarımlar</td><td>Bir kişinin tercihleri ve özellikleri hakkında profil veya özet oluşturmak için yukarıda listelenen toplanan kişisel bilgilerden çıkarılan çıkarımlar</td><td>HAYIR</td></tr>
    <tr><td>K. Hassas kişisel bilgiler</td><td>—</td><td>HAYIR</td></tr>
  </tbody>
</table>

<h3>Haklarınız</h3>
<p>Belirli ABD eyaletlerindeki veri koruma yasaları kapsamında haklarınız vardır. Bu haklar şunları içerir:</p>
<ul>
  <li><strong>Bilme hakkı</strong> — kişisel verilerinizi işleyip işlemediğimizi öğrenme</li>
  <li><strong>Erişim hakkı</strong> — kişisel verilerinize erişim</li>
  <li><strong>Düzeltme hakkı</strong> — kişisel verilerinizdeki hataları düzeltme</li>
  <li><strong>Silme talep hakkı</strong> — kişisel verilerinizin silinmesini talep etme</li>
  <li><strong>Kopyasını alma hakkı</strong> — daha önce paylaştığınız kişisel verilerin kopyasını alma</li>
  <li><strong>Ayrımcılık yapılmama hakkı</strong> — haklarınızı kullandığınız için ayrımcılığa maruz kalmama</li>
  <li><strong>Vazgeçme hakkı</strong> — kişisel verilerinizin hedefli reklamcılık, kişisel veri satışı veya profilleme için kullanılması durumunda bu işlemden vazgeçme</li>
</ul>

<h3>Haklarınızı Nasıl Kullanırsınız</h3>
<p>Bu hakları kullanmak için <a href="mailto:info@querylensio.com">info@querylensio.com</a> adresinden bize e-posta gönderebilir veya bu belgenin altındaki iletişim bilgilerine başvurabilirsiniz.</p>

<hr/>

<h2 id="policyupdates">15. BU BİLDİRİMİ GÜNCELLEME YAPACAK MIYIZ?</h2>
<p><strong><em>Kısaca: Evet, ilgili yasalara uymak için bu bildirimi gerektiğinde güncelleyeceğiz.</em></strong></p>
<p>Bu Gizlilik Bildirimini zaman zaman güncelleyebiliriz. Güncellenen sürüm, bu Gizlilik Bildiriminin en üstünde güncellenmiş bir "Revize Edildi" tarihi ile belirtilecektir. Bu Gizlilik Bildiriminde önemli değişiklikler yaparsak, bu değişikliklerin bildirimini belirgin bir şekilde yayınlayarak veya doğrudan size bir bildirim göndererek sizi bilgilendirebiliriz. Bilgilerinizi nasıl koruduğumuz hakkında bilgi sahibi olmak için bu Gizlilik Bildirimini sık sık incelemenizi öneririz.</p>

<hr/>

<h2 id="contact">16. BU BİLDİRİM HAKKINDA BİZİMLE NASIL İLETİŞİME GEÇEBİLİRSİNİZ?</h2>
<p>Bu bildiri hakkında sorularınız veya yorumlarınız varsa, aşağıdaki adrese posta yoluyla iletişime geçebilirsiniz:</p>
<p><strong>QueryLens</strong><br/>
<a href="mailto:info@querylensio.com">info@querylensio.com</a></p>

<hr/>

<h2 id="request">17. HAKKINIZDAKI VERİLERİ NASIL İNCELEYEBİLİR, GÜNCELLEYEBİLİR VEYA SİLEBİLİRSİNİZ?</h2>
<p>Ülkenizin veya ABD'deki ikamet ettiğiniz eyaletin geçerli yasalarına göre, bizden topladığımız kişisel bilgilere erişim talep etme, bunların nasıl işlendiğine dair ayrıntıları öğrenme, hataları düzeltme veya kişisel bilgilerinizi silme hakkına sahip olabilirsiniz. Ayrıca kişisel bilgilerinizin işlenmesine ilişkin rızanızı geri çekme hakkınız da olabilir. Bu haklar bazı durumlarda geçerli mevzuat tarafından sınırlandırılabilir. Kişisel bilgilerinizi incelemek, güncellemek veya silmek için lütfen <a href="mailto:info@querylensio.com">info@querylensio.com</a> adresinden bizimle iletişime geçin.</p>
`;

export default function PrivacyPolicy() {
  const { i18n } = useTranslation();
  const isTR = i18n.language === 'tr';

  return (
    <div className="privacy-page">
      <nav className="privacy-nav">
        <Link to="/" className="ql-logo">
          Query<em>Lens</em>
        </Link>
        <LanguageToggle />
      </nav>

      <div
        className="privacy-content"
        dangerouslySetInnerHTML={{ __html: isTR ? CONTENT_TR : CONTENT_EN }}
      />

      <footer className="privacy-footer">
        <span>© 2026 QueryLens.</span>
        <Link to="/">← {isTR ? 'Ana Sayfaya Dön' : 'Back to Home'}</Link>
      </footer>
    </div>
  );
}
