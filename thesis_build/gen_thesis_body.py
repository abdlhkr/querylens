# -*- coding: utf-8 -*-
"""Tez metni (Bölüm 1–7), Kaynaklar ve Ekler. gen_thesis.py tarafından çağrılır."""


def write_body(T):
    P = T.para
    B = T.bullet

    # ══════════════════════════════════════════════════════════════════════════
    # 1. GİRİŞ
    # ══════════════════════════════════════════════════════════════════════════
    T.h(1, "GİRİŞ", brk=False)
    P("Kurumların ürettiği veri hacmi her geçen yıl katlanarak artarken, bu verinin "
      "büyük çoğunluğu hâlâ ilişkisel veri tabanlarında saklanmaktadır. İlişkisel "
      "veri tabanlarına erişimin standart yolu, Yapılandırılmış Sorgu Dili (SQL) "
      "kullanmaktır. Ancak SQL, belirli bir uzmanlık ve veri tabanı şemasına dair "
      "ayrıntılı bilgi gerektirir. Bu durum, bir kurumdaki karar vericiler, analistler "
      "ve saha çalışanları gibi teknik olmayan kullanıcıların, ihtiyaç duydukları "
      "bilgiye doğrudan erişmesini güçleştirmekte; veriyle aralarına bir aracı katman "
      "(genellikle bir yazılım geliştirici veya hazır rapor) koymaktadır. Bu aracılık, "
      "hem zaman kaybına hem de verinin sağladığı değerin tam olarak ortaya "
      "çıkarılamamasına yol açar.")
    P("Son yıllarda büyük dil modellerinin (Large Language Model, LLM) olağanüstü "
      "gelişimi, doğal dil ile yazılmış bir soruyu otomatik olarak SQL’e çeviren "
      "“doğal dilden SQL’e” (text-to-SQL) sistemlerini yeniden gündeme taşımıştır. Bu "
      "sistemler, kullanıcının “geçen ay en çok satan beş ürün hangisidir?” gibi günlük "
      "dilde sorduğu bir soruyu, çalıştırılabilir bir SQL sorgusuna dönüştürerek veriye "
      "doğrudan, aracısız erişim vaat eder (Şekil 1.1). Buna karşın, bu vaadin gerçek "
      "kurumsal ortamlarda hayata geçirilmesi önemli mühendislik sorunlarını da "
      "beraberinde getirir.")
    T.figure("fig_1_1_text2sql.png",
             "Şekil 1.1 Doğal dilden SQL’e dönüşümün genel akışı", width_cm=15.5)

    T.h(2, "Problem Tanımı")
    P("Doğal dilden SQL üretiminde karşılaşılan en temel sorunlardan biri ölçeklenme "
      "sorunudur. Akademik kıyaslama kümelerinde (örneğin tek bir veri tabanı ve "
      "birkaç tablo) etkileyici sonuçlar veren modeller, yüzlerce hatta binlerce tablo "
      "ve on binlerce kolon içerebilen gerçek kurumsal veri tabanlarıyla "
      "karşılaştıklarında belirgin biçimde başarısızlaşır. Bunun başlıca nedeni, "
      "modele verilen bağlamın (context) sınırlı olmasıdır: tüm şemayı tek bir isteme "
      "(prompt) sığdırmak çoğu zaman teknik olarak mümkün değildir; mümkün olduğu "
      "durumlarda dahi modelin ilgili tabloları yüzlerce alakasız tablo arasından "
      "ayırt etmesi güçleşir ve doğruluk düşer. Dolayısıyla, “tüm şemayı modele ver” "
      "yaklaşımı kurumsal ölçekte uygulanabilir değildir.")
    P("İkinci sorun güvenliktir. Üretken bir modelin ürettiği sorgunun, kullanıcının "
      "veri tabanı üzerinde yıkıcı işlemler (silme, güncelleme, şema değiştirme) "
      "yapmamasının güvence altına alınması gerekir. Üçüncü olarak, kullanıcının her "
      "sorusu veri tabanından yanıtlanabilir nitelikte değildir; bir soru tamamen "
      "alakasız (genel bilgi) olabileceği gibi, veri tabanıyla ilgili olup şemada "
      "karşılığı bulunmayan bir veri de talep edebilir. Sistemin, bu durumları ayırt "
      "edip kullanıcıyı doğru biçimde bilgilendirmesi beklenir. Son olarak, böyle bir "
      "yeteneğin tek bir betik olarak değil; kimlik doğrulama, kullanıcı yönetimi, "
      "veri tabanı bağlantı yönetimi ve güvenli sorgu yürütme gibi bileşenleri olan, "
      "çok kullanıcılı ve gerçek kullanıma hazır bir SaaS ürünü içinde sunulması "
      "gerekir.")

    T.h(2, "Çalışmanın Amacı ve Kapsamı")
    P("Bu tezin amacı, yukarıda sıralanan sorunları bütüncül biçimde ele alan, "
      "kullanıcıların kendi veri tabanlarını bağlayıp doğal dil ile sorgulayabildiği "
      "QueryLens adlı bir SaaS platformunun tasarımını ve gerçekleştirimini ortaya "
      "koymaktır. Çalışmanın merkezî katkısı, ölçeklenme sorununu çözmek için "
      "tasarlanan getirim-destekli şema bağlama (Retrieval-Augmented Schema Linking, "
      "RASL) yaklaşımının uçtan uca bir mühendislik uyarlamasıdır.")
    P("Kapsam olarak tez; (i) platformun mikroservis mimarisini, (ii) kullanıcının "
      "veri tabanına güvenli erişim sağlayan aracı (agent) ve WebSocket protokolünü, "
      "(iii) veri tabanı içe bakışı (introspection) ile şema metadata’sının "
      "çıkarılmasını, (iv) bu metadata’nın bir vektör veri tabanına indekslenmesini, "
      "(v) sorgu anında melez arama ile ilgili tabloların getirilip SQL üretilmesini "
      "ve (vi) güvenlik ile soru çözümleme mekanizmalarını içermektedir. Modelin "
      "kendisinin eğitimi veya ince ayarı (fine-tuning) kapsam dışındadır; sistem, "
      "hazır bir büyük dil modelini istem mühendisliği ve getirim ile yönlendirme "
      "ilkesine dayanır.")

    T.h(2, "Önceki Çalışmalar")
    P("Doğal dilden SQL üretimi, veri tabanı ve doğal dil işleme alanlarının kesişiminde "
      "uzun bir araştırma geçmişine sahiptir. Erken dönem çalışmalar kural tabanlı ve "
      "anlamsal ayrıştırmaya (semantic parsing) dayanırken, derin öğrenmenin "
      "yaygınlaşmasıyla birlikte Spider ve WikiSQL gibi büyük ölçekli kıyaslama "
      "kümeleri alanın gelişimine yön vermiştir (Yu vd., 2018). Bu kümeler üzerinde "
      "kodlayıcı-çözücü (encoder-decoder) mimarileri ve şemaya duyarlı modeller "
      "önemli ilerlemeler kaydetmiştir.")
    P("Büyük dil modellerinin ortaya çıkışıyla birlikte, doğal dilden SQL üretimi "
      "büyük ölçüde istem tabanlı (prompting) bir probleme dönüşmüştür. Modeli "
      "doğrudan ince ayarlamak yerine, şema ve birkaç örnekle yönlendirme (in-context "
      "learning) yaygın bir yaklaşım hâline gelmiştir (Brown vd., 2020). Ancak bu "
      "yaklaşımın kurumsal ölçekteki en büyük kısıtı, modele verilebilecek şema "
      "miktarının sınırlı olmasıdır. Bu kısıtı aşmak için getirim-destekli üretim "
      "(Retrieval-Augmented Generation, RAG) paradigması öne çıkmıştır (Lewis vd., "
      "2020): modele, soruya en alakalı bilgi parçaları bir arama katmanı aracılığıyla "
      "getirilip verilir.")
    P("Bu tezin doğrudan ilham aldığı çalışma, Amazon araştırmacıları tarafından "
      "önerilen RASL (Retrieval-Augmented Schema Linking) yöntemidir (Amazon Science, "
      "2025). RASL, devasa veri tabanlarında doğal dilden SQL üretimini ölçeklenebilir "
      "kılmak amacıyla, veri tabanı şemasını ve metadata’sını ayrık anlamsal birimlere "
      "(tablo açıklamaları, kolon adları vb.) ayırıp her birini ayrı ayrı indeksleyen "
      "ve sorgu anında getiren bileşen tabanlı bir getirim mimarisi önerir. Yöntemin "
      "en önemli özelliklerinden biri, alana özgü ince ayar gerektirmeden çalışabilmesi "
      "ve böylece farklı kurumsal ortamlara kolayca uygulanabilmesidir. QueryLens, bu "
      "fikirleri akademik bir prototip düzeyinde değil; çok kullanıcılı, güvenli ve "
      "dağıtılabilir bir SaaS platformu içinde gerçek bir mühendislik ürünü olarak "
      "hayata geçirir.")

    T.h(2, "Kullanılan Yöntem ve Tezin Organizasyonu")
    P("Çalışmada izlenen yöntem, tasarım-bilimi (design science) yaklaşımına uygun "
      "olarak bir yazılım eseri (artifact) inşa etmek ve bu eseri niteliksel "
      "değerlendirme ve örnek senaryolarla incelemektir. Platform, mikroservis "
      "mimarisi ilkelerine göre tasarlanmış; her servis tek bir sorumluluğa sahip, "
      "bağımsız olarak dağıtılabilir bir birim olarak gerçeklenmiştir. Yapay zeka "
      "katmanı Python/FastAPI ve LangChain ile, çekirdek iş servisleri Java/Spring "
      "Boot ile, ön yüz ise React ile geliştirilmiştir. Tüm bileşenler Docker ile "
      "konteynerleştirilmiştir.")
    P("Tezin geri kalanı şu şekilde düzenlenmiştir. İkinci bölüm, çalışmanın kuramsal "
      "altyapısını; doğal dilden SQL’e, büyük dil modelleri, getirim-destekli üretim, "
      "vektör veri tabanları ve özellikle şema bağlama ile RASL yaklaşımını "
      "açıklar. Üçüncü bölüm, QueryLens platformunun genel mikroservis mimarisini, "
      "güvenlik modelini ve aracı protokolünü tanıtır. Dördüncü bölüm, tezin merkezî "
      "katkısı olan getirim-destekli şema bağlama ve SQL üretim hattını ayrıntılı "
      "olarak ele alır. Beşinci bölüm gerçekleştirim ayrıntılarını, altıncı bölüm "
      "niteliksel değerlendirme ile örnek senaryoları sunar. Yedinci bölüm genel "
      "sonuçları ve gelecek çalışma önerilerini içerir.")

    # ══════════════════════════════════════════════════════════════════════════
    # 2. KURAMSAL ALTYAPI
    # ══════════════════════════════════════════════════════════════════════════
    T.h(1, "KURAMSAL ALTYAPI", brk=True)
    P("Bu bölüm, QueryLens’in dayandığı kavram ve teknolojileri tanıtır. Önce doğal "
      "dilden SQL’e probleminin genel çerçevesi, ardından büyük dil modelleri ve istem "
      "mühendisliği ele alınır. Sonrasında getirim-destekli üretim, vektör veri "
      "tabanları ve melez arama açıklanır. Bölüm, tezin merkezinde yer alan şema "
      "bağlama ve RASL yaklaşımının ayrıntılı incelemesiyle sona erer.")

    T.h(2, "Doğal Dilden SQL’e (Text-to-SQL) Problemi")
    P("Doğal dilden SQL’e problemi, doğal dilde ifade edilmiş bir bilgi ihtiyacını, "
      "belirli bir veri tabanı şeması üzerinde çalıştırılabilir bir SQL sorgusuna "
      "eşleyen bir dönüşüm problemidir. Bu dönüşümün doğru yapılabilmesi için sistemin "
      "iki tür bilgiyi birleştirmesi gerekir: kullanıcının niyetini taşıyan doğal dil "
      "ifadesi ve hedef veri tabanının yapısını tanımlayan şema. Şema bilgisi; "
      "tabloların adlarını, kolonlarını, veri tiplerini, birincil ve yabancı "
      "anahtarları ve tablolar arası ilişkileri kapsar.")
    P("Problemin zorluğu çok katmanlıdır. Doğal dil, doğası gereği belirsiz ve "
      "bağlama duyarlıdır; aynı kavram farklı sözcüklerle ifade edilebilir (örneğin "
      "“müşteri” ile “alıcı”). Şema tarafında ise adlandırma çoğu zaman teknik ve "
      "kısaltılmıştır (örneğin cust_id). Sistemin görevi, kullanıcının dilindeki "
      "kavramlar ile şemadaki yapılar arasında doğru eşlemeyi kurmaktır; bu alt "
      "probleme şema bağlama (schema linking) denir ve doğru SQL üretiminin en kritik "
      "adımlarından biridir.")

    T.h(2, "Büyük Dil Modelleri ve İstem Mühendisliği")
    P("Büyük dil modelleri, çok büyük metin yığınları üzerinde eğitilmiş, bir sonraki "
      "kelimeyi (token) olasılıksal olarak tahmin eden derin sinir ağlarıdır. Yeterli "
      "ölçeğe ulaştıklarında, açıkça eğitilmedikleri görevleri dahi yalnızca uygun bir "
      "istem (prompt) ile yerine getirebilen, bağlam içi öğrenme (in-context learning) "
      "olarak adlandırılan bir yetenek sergilerler (Brown vd., 2020). Doğal dilden SQL "
      "üretimi de bu yeteneğin tipik bir uygulamasıdır: modele, veri tabanı şeması ve "
      "kullanıcının sorusu uygun biçimde verildiğinde, model çalıştırılabilir bir SQL "
      "sorgusu üretebilir.")
    P("İstem mühendisliği, modelin davranışını eğitmeden, yalnızca verilen metni "
      "tasarlayarak yönlendirme disiplinidir. QueryLens’te istemler iki rol üzerine "
      "kuruludur: modelin görevini ve katı kurallarını tanımlayan sistem istemi "
      "(system prompt) ve kullanıcının doğal dil sorusunu taşıyan kullanıcı istemi. "
      "Sistem istemi, üretilecek sorgunun yalnızca tek bir SELECT ifadesi olması, "
      "tablo adlarının şema önekiyle nitelenmesi (örneğin public.users) ve hiçbir "
      "açıklama, kod bloğu veya yıkıcı ifade içermemesi gibi kuralları açıkça dayatır. "
      "Bu kurallar, hem doğruluğu hem de güvenliği istem düzeyinde güvence altına "
      "almanın ilk hattını oluşturur.")

    T.h(2, "Getirim-Destekli Üretim (RAG)")
    P("Getirim-destekli üretim (Retrieval-Augmented Generation, RAG), bir dil "
      "modelinin yanıtını yalnızca kendi parametrelerindeki bilgiyle değil; sorgu "
      "anında dış bir bilgi kaynağından getirilen ilgili belgelerle besleyen bir "
      "paradigmadır (Lewis vd., 2020). Temel akış üç adımdan oluşur (Şekil 2.1): "
      "kullanıcının sorusu bir getirici (retriever) tarafından bir bilgi tabanında "
      "aranır; en alakalı belgeler getirilir; bu belgeler bağlam olarak modele "
      "verilerek nihai yanıt üretilir.")
    T.figure("fig_2_1_rag.png",
             "Şekil 2.1 Getirim-destekli üretim (RAG) genel mimarisi", width_cm=13.0)
    P("RAG’in temel avantajı, modelin sınırlı bağlam penceresini en verimli biçimde "
      "kullanmasıdır: ilgisiz bilgiyle bağlamı doldurmak yerine, yalnızca soruyla "
      "alakalı parçalar modele sunulur. Bu sayede hem çok büyük bilgi tabanları "
      "ölçeklenebilir biçimde kullanılabilir hem de modelin yanlış bilgi üretme "
      "(halüsinasyon) eğilimi azaltılır. QueryLens’te bilgi tabanı, kullanıcının veri "
      "tabanındaki tabloların metadata’sıdır; getirilen belgeler ise soruya en alakalı "
      "tabloların şema tanımlarıdır.")

    T.h(2, "Vektör Veri Tabanları, Gömme ve Melez Arama")
    P("Getirim adımının kalbinde, metin parçalarının anlamsal benzerliğe göre "
      "aranabilmesi yatar. Bu, metinlerin gömme (embedding) adı verilen yüksek "
      "boyutlu sayısal vektörlere dönüştürülmesiyle sağlanır. Anlamca yakın metinler, "
      "vektör uzayında birbirine yakın konumlanır; böylece bir sorgu vektörüne en "
      "yakın belge vektörlerini bulmak, anlamca en alakalı belgeleri bulmak anlamına "
      "gelir. Vektör veri tabanları, bu tür benzerlik aramalarını büyük ölçekte verimli "
      "biçimde yapmak için tasarlanmış özelleşmiş sistemlerdir. Bu çalışmada, gömme "
      "üretimini kendi modülüyle (text2vec-openai) yürütebilen Weaviate kullanılmıştır.")
    P("Yalnızca anlamsal (vektör) arama her zaman yeterli değildir; özellikle tam "
      "kelime eşleşmelerinin önemli olduğu durumlarda (örneğin bir kolon adının "
      "soruda birebir geçmesi) kelime tabanlı arama daha güçlüdür. Bu nedenle "
      "QueryLens, melez arama (hybrid search) kullanır: kelime tabanlı BM25 skoru ile "
      "vektör benzerlik skoru, bir ağırlık katsayısı (α) ile birleştirilir (Şekil "
      "2.2). α = 0 saf kelime aramasına, α = 1 saf vektör aramasına karşılık gelir; bu "
      "çalışmada dengeli bir başlangıç değeri olarak α = 0,5 benimsenmiştir. Melez "
      "arama, hem eş anlamlı/dolaylı ifadeleri (vektör) hem de birebir terim "
      "eşleşmelerini (BM25) yakalayarak getirim kalitesini artırır.")
    T.figure("fig_2_2_hybrid.png",
             "Şekil 2.2 Melez aramada BM25 ve vektör skorlarının birleştirilmesi",
             width_cm=13.0)

    T.h(2, "Şema Bağlama ve RASL Yaklaşımı")
    P("Şema bağlama (schema linking), kullanıcının doğal dil sorusundaki kavramları "
      "veri tabanı şemasındaki tablo ve kolonlarla eşleştirme adımıdır ve doğru SQL "
      "üretiminin belirleyici aşamasıdır. Küçük şemalarda bu adım, tüm şemayı modele "
      "vererek dolaylı olarak modele bırakılabilir. Ancak şema büyüdükçe bu yaklaşım "
      "iki nedenden ötürü çöker: ilk olarak tüm şema modelin bağlam penceresine "
      "sığmaz; ikinci olarak, sığsa bile modelin yüzlerce tablo arasından doğru "
      "olanları seçmesi zorlaşır ve dikkat dağılır. Dolayısıyla devasa şemalarda "
      "şema bağlama, modele bırakılamayacak kadar kritik ve ayrı ele alınması gereken "
      "bir alt problem hâline gelir.")
    P("RASL (Retrieval-Augmented Schema Linking), Amazon araştırmacılarının bu sorunu "
      "çözmek için önerdiği bir yaklaşımdır (Amazon Science, 2025). RASL’in temel "
      "fikri, şema bağlamayı bir getirim problemine indirgemektir: veri tabanı "
      "şeması ve onunla ilgili metadata, ayrık anlamsal birimlere (örneğin her tablo "
      "için bir tanım, kolon adları, açıklamalar) ayrıştırılır; her birim ayrı ayrı "
      "indekslenir ve sorgu anında, soruya en alakalı birimler getirilir. Bu sayede "
      "modele tüm şema değil; yalnızca ilgili, yönetilebilir büyüklükte bir alt küme "
      "verilir. RASL, bu işlemi iki aşamada ele alır: inşa zamanında (build-time) bir "
      "bilgi tabanı oluşturma ve sorgu anında (inference-time) getirim-destekli şema "
      "bağlama.")
    P("RASL yaklaşımının öne çıkan birkaç ilkesi vardır. Birincisi, farklı türdeki "
      "bilgilerin (tablo açıklamaları, kolon adları vb.) anlamsal ayırt ediciliğini "
      "korumak için ayrı ayrı indekslenmesidir. İkincisi, getirimde önceliğin etkili "
      "tablo belirlemeye verilmesi; kolon düzeyi bilginin ise getirilen tablo sayısını "
      "yönetilebilir bir bağlam bütçesi içinde tutacak biçimde kullanılmasıdır. "
      "Üçüncüsü, yöntemin alana özgü ince ayar gerektirmemesi ve bu nedenle çeşitli "
      "kurumsal ortamlara dağıtılabilir olmasıdır. QueryLens, bu ilkeleri kendi "
      "mimarisine uyarlar: her tabloyu bir getirim birimi olarak ele alır, tablo "
      "düzeyinde melez arama yapar, getirilen tabloları bir önem katsayısıyla yeniden "
      "sıralar ve yalnızca üst sıradaki tabloların şemasını modele verir. Bu uyarlama "
      "ile farklar Bölüm 4.9’da ayrıntılı olarak karşılaştırılmıştır.")

    # ══════════════════════════════════════════════════════════════════════════
    # 3. SİSTEM MİMARİSİ
    # ══════════════════════════════════════════════════════════════════════════
    T.h(1, "SİSTEM MİMARİSİ", brk=True)
    P("Bu bölüm, QueryLens platformunun genel mimarisini tanıtır. Platform, her biri "
      "tek bir sorumluluğa sahip, bağımsız olarak dağıtılabilen servislerden oluşan "
      "bir mikroservis mimarisi üzerine kuruludur. Bölümde sırasıyla genel bakış, "
      "servislerin sorumlulukları, kimlik doğrulama ve güvenlik modeli, aracı–sunucu "
      "WebSocket protokolü ve veri sahipliği tasarımı ele alınmaktadır.")

    T.h(2, "Genel Bakış ve Mikroservis Mimarisi")
    P("QueryLens, bir kullanıcının kendi veri tabanını platforma bağlamasını ve bu "
      "veri tabanını doğal dil ile sorgulamasını sağlayan, çok kullanıcılı bir SaaS "
      "ürünüdür. Sistem, sorumlulukların net biçimde ayrıldığı yedi ana bileşenden "
      "oluşur (Şekil 3.1): React tabanlı ön yüz (front-app), tüm dış trafiğin "
      "girişini denetleyen geçit (gateway-service), kimlik doğrulama servisi "
      "(auth-service), kullanıcı profili servisi (user-service), veri tabanı bağlantı "
      "ve sorgu yönetimi servisi (db-service), yapay zeka servisi (fast-service) ve "
      "kullanıcının veri tabanı ortamında çalışan WebSocket aracısı (agent).")
    T.figure("fig_3_1_arch.png",
             "Şekil 3.1 QueryLens mikroservis sistem mimarisi", width_cm=15.5)
    P("Bu mimaride, hiçbir servis bir diğerinin veri tabanına doğrudan erişmez; "
      "servisler arası iletişim yalnızca HTTP üzerinden ve geçit tarafından "
      "enjekte edilen kimlik başlıkları aracılığıyla gerçekleşir. Mikroservis "
      "yaklaşımının sağladığı başlıca yararlar; her bileşenin bağımsız "
      "ölçeklenebilmesi, teknoloji çeşitliliğine izin vermesi (yapay zeka katmanı "
      "Python, iş servisleri Java) ve bir bileşendeki arızanın diğerlerine "
      "yayılmasını sınırlayan hata yalıtımıdır.")

    T.h(2, "Servisler ve Sorumlulukları")
    P("Platformu oluşturan servisler ve dayandıkları teknolojiler ile çalıştıkları "
      "portlar Çizelge 3.1’de özetlenmiştir. Her servis tek bir iş alanına "
      "odaklanır ve kendi yaşam döngüsüne sahiptir.")
    T.table_caption("Çizelge 3.1 QueryLens servisleri, teknolojileri ve portları")
    T.table([
        ["Servis", "Teknoloji", "Port", "Sorumluluk"],
        ["gateway-service", "Spring Cloud Gateway", "8080", "Yönlendirme, JWT doğrulama, hız sınırlama"],
        ["auth-service", "Spring Boot + JWT", "8081", "Kimlik doğrulama, OTP, OAuth2"],
        ["user-service", "Spring Boot", "8082", "Kullanıcı profil verisi"],
        ["db-service", "Spring Boot", "8083", "Bağlantı yönetimi, içe bakış, aracı iletişimi"],
        ["fast-service", "FastAPI + LangChain", "8000", "Soru çözümleme, SQL üretimi, getirim"],
        ["front-app", "React + Vite", "5173", "Kullanıcı arayüzü"],
        ["agent", "Node.js", "—", "Kullanıcı DB’sinde sorgu yürütme"],
        ["Weaviate", "Vektör VTYS", "8085", "Tablo metadata’sının indekslenmesi"],
    ], widths_cm=[3.2, 3.6, 1.3, 6.4], font_size=9)
    P("Altyapı katmanında, her biri ayrı bir mikroservise ait üç ayrı PostgreSQL "
      "örneği (kimlik, kullanıcı ve cihaz veri tabanları), hız sınırlama için Redis ve "
      "tablo metadata’sının indekslendiği Weaviate vektör veri tabanı yer alır. "
      "Veri sahipliğinin servisler arasında bu şekilde ayrılması, mikroservis "
      "mimarisinin temel ilkelerinden biridir ve Bölüm 3.5’te ayrıntılandırılmıştır.")

    T.h(2, "Kimlik Doğrulama ve Güvenlik")
    P("Platformda kimlik doğrulama, JSON Web Token (JWT) tabanlıdır ancak belirteçler "
      "istemciye HttpOnly çerezler (cookie) olarak verilir. HttpOnly çerez kullanımı, "
      "belirtecin tarayıcıdaki betiklerce okunamamasını sağlayarak siteler arası "
      "betik çalıştırma (XSS) saldırılarına karşı koruma sağlar. Kimlik doğrulama "
      "akışının merkezinde geçit servisi yer alır: gelen her istekte erişim çerezini "
      "okur, JWT’yi doğrular ve geçerliyse isteğe kullanıcı kimliğini taşıyan "
      "başlıkları (X-User-Id, X-User-Role, X-User-Email) ekleyerek arka uç servislerine "
      "iletir (Şekil 3.2).")
    T.figure("fig_3_2_auth.png",
             "Şekil 3.2 Geçit servisinin JWT doğrulaması ve kimlik başlığı enjeksiyonu",
             width_cm=15.0)
    P("Bu tasarımın önemli bir sonucu, arka uç servislerinin JWT’yi yeniden "
      "doğrulamamasıdır; onlar yalnızca geçidin enjekte ettiği başlıklara güvenir. "
      "Böylece kimlik doğrulama mantığı tek bir noktada toplanır ve servisler "
      "sadeleşir. Güvenliği güçlendiren ek mekanizmalar arasında; iki adımlı tek "
      "kullanımlık şifre (OTP) akışları, kötüye kullanımı sınırlamak için geçit "
      "düzeyinde Redis tabanlı hız sınırlama (rate limiting) ve Google OAuth2 ile "
      "oturum açma desteği yer alır. Yapay zeka katmanında ise üretilen sorguların "
      "yalnızca SELECT ile sınırlandırılması, güvenliğin sorgu üretim düzeyindeki "
      "yansımasıdır (bkz. Bölüm 4.7).")

    T.h(2, "Aracı–Sunucu WebSocket Protokolü")
    P("QueryLens’in en ayırt edici tasarım kararlarından biri, kullanıcının veri "
      "tabanı kimlik bilgilerinin (özellikle parolaların) hiçbir zaman merkezî "
      "platforma gönderilmemesidir. Bunun yerine kullanıcı, kendi ağında bir "
      "Node.js aracısı çalıştırır. Bu aracı, platforma bir WebSocket bağlantısı "
      "kurar ve veri tabanına erişim yalnızca bu aracı üzerinden, kullanıcının kendi "
      "ortamında gerçekleşir. Böylece hassas kimlik bilgileri kullanıcının "
      "denetiminde kalır.")
    P("Aracı ile sunucu arasındaki haberleşme mesaj tabanlı bir protokolle yürür "
      "(Şekil 3.3). Aracı bağlandığında, db-service ona parolasız bağlantı bilgisini "
      "taşıyan bir NEW_DATABASE mesajı gönderir; aracı bağlantıyı dener ve sonucu "
      "DATABASE_VERIFIED veya DATABASE_FAILED ile bildirir. Bağlantı doğrulandıktan "
      "sonra hem içe bakış sorguları hem de kullanıcı sorularından üretilen SQL "
      "sorguları, db-service tarafından aracıya iletilir; aracı bunları kullanıcının "
      "veri tabanında çalıştırır ve sonuç satırlarını WebSocket üzerinden geri döndürür.")
    T.figure("fig_3_3_ws.png",
             "Şekil 3.3 Aracı–sunucu WebSocket protokolünün mesaj akışı", width_cm=14.0)

    T.h(2, "Veri Sahipliği ve Veri Tabanı Tasarımı")
    P("Mikroservis mimarisinin temel ilkelerinden biri, her servisin kendi verisinin "
      "tek sahibi olmasıdır. QueryLens’te bu ilke, üç ayrı PostgreSQL örneğiyle "
      "hayata geçirilmiştir. Kimlik veri tabanı; kullanıcı kimlik bilgilerini, "
      "yenileme belirteçlerini ve doğrulama kodlarını yalnızca auth-service’in "
      "erişimine açık biçimde tutar. Kullanıcı veri tabanı; ad, yaş gibi profil "
      "verilerini user-service’e ait olarak saklar. Cihaz veri tabanı ise veri tabanı "
      "bağlantılarını, aracı kayıtlarını ve içe bakış sonucu çıkarılan tablo/kolon "
      "metadata’sını db-service’in sahipliğinde barındırır.")
    P("İçe bakış sürecinde çıkarılan yapısal metadata, iki varlıkla modellenir: tablo "
      "düzeyinde bilgiyi tutan TableEntity ve kolon düzeyinde bilgiyi tutan "
      "ColumnEntity. TableEntity; şema adı, tablo adı, kolon sayısı, yaklaşık satır "
      "sayısı, önem katsayısı, kolon listesi ve yabancı anahtar ilişkilerini içerir. "
      "ColumnEntity ise kolon adı, veri tipi, birincil/yabancı anahtar bilgisini ve "
      "varsa bağlandığı hedef tabloyu tutar. Bu yapısal metadata, hem vektör veri "
      "tabanına indeksleme için hem de sorgu anında modele verilecek şema metnini "
      "üretmek için kullanılır (Bölüm 4).")

    # ══════════════════════════════════════════════════════════════════════════
    # 4. ŞEMA BAĞLAMA VE GETİRİM-DESTEKLİ SORGU ÜRETİMİ  (ANA KATKI)
    # ══════════════════════════════════════════════════════════════════════════
    T.h(1, "ŞEMA BAĞLAMA VE GETİRİM-DESTEKLİ SORGU ÜRETİMİ", brk=True)
    P("Bu bölüm, tezin merkezî katkısını oluşturan getirim-destekli şema bağlama "
      "hattını ayrıntılı biçimde ele alır. Önce devasa şema problemi gerekçelendirilir; "
      "ardından inşa zamanı (içe bakış, açıklama üretimi, indeksleme) ile sorgu anı "
      "(melez arama, yeniden sıralama, soru çözümleme, SQL üretimi) adım adım "
      "açıklanır. Bölüm, yaklaşımın RASL ile karşılaştırılmasıyla sona erer.")

    T.h(2, "Motivasyon: Devasa Şema Problemi")
    P("Bir dil modeline doğru SQL ürettirmenin önkoşulu, ona ilgili şemayı vermektir. "
      "Ancak gerçek kurumsal veri tabanları yüzlerce tablo ve binlerce kolon "
      "içerebilir. Böyle bir şemanın tamamını isteme koymak çoğu zaman modelin bağlam "
      "penceresini aşar; aşmasa bile maliyeti artırır ve modelin dikkatini dağıtarak "
      "doğruluğu düşürür. Dahası, her sorgu için tüm şemayı işlemek, hem gecikme hem "
      "de jeton (token) maliyeti açısından savurganlıktır; çünkü tipik bir sorunun "
      "yanıtı genellikle yalnızca birkaç tabloyu ilgilendirir.")
    P("Bu gözlem, çözümün özünü ortaya koyar: tüm şemayı her seferinde modele vermek "
      "yerine, yalnızca soruya alakalı tabloları getirip vermek. Bu, doğal dilden SQL "
      "problemini bir getirim problemiyle birleştirmek anlamına gelir ve RASL "
      "yaklaşımının da temelini oluşturur. QueryLens, bu çözümü iki aşamalı bir hat "
      "olarak gerçekler: veri tabanı bağlandığında bir kez çalışan inşa zamanı "
      "indeksleme hattı ve her soruda çalışan sorgu anı getirim hattı.")

    T.h(2, "Veri Tabanı İçe Bakışı ve Metadata Çıkarımı")
    P("İnşa zamanı hattı, bir veri tabanı bağlanıp doğrulandığında otomatik olarak "
      "tetiklenir (Şekil 4.1). db-service, doğrulama olayını (DatabaseVerifiedEvent) "
      "dinler ve eşzamansız (asynchronous) bir içe bakış süreci başlatır. Bu süreç, "
      "her şema için iki sabit, veri tabanı türüne özgü sorgu çalıştırır: biri "
      "kolon düzeyinde metadata’yı (kolon adı, veri tipi, birincil/yabancı anahtar "
      "bilgisi) döndürür; diğeri tablo başına yaklaşık satır sayısını verir. Aynı "
      "veri tabanı için içe bakış yalnızca bir kez yapılır; aracı yeniden "
      "bağlandığında bağlantı tekrar doğrulansa da metadata zaten mevcutsa süreç "
      "atlanır.")
    T.figure("fig_4_1_index.png",
             "Şekil 4.1 İnşa zamanı içe bakış ve indeksleme hattı", width_cm=15.5)
    P("İçe bakışta dikkat edilen önemli bir ayrıntı, satır sayısı istatistiklerinin "
      "güncelliğidir. Yeni yüklenmiş bir veri tabanında istatistikler henüz "
      "toplanmamış olabilir ve tüm tablolar sıfır satır gösterebilir; bu durum, boş "
      "tabloları eleyen süzgecin yanlışlıkla tüm tabloları elemesine yol açabilir. "
      "Bunu önlemek için sistem, istatistiklerin bayatladığını sezdiğinde (tablolar "
      "var ancak hepsi sıfır satır bildiriyor) bir kez ANALYZE çalıştırarak gerçek "
      "sayıları elde eder; ayrıca süzgeçten hiç sonuç dönmezse şemayı yine de "
      "yakalamak için süzgeçsiz bir geri dönüş (fallback) sorgusu çalıştırır. Bu "
      "önlemler, içe bakışın farklı veri tabanı durumlarında dayanıklı çalışmasını "
      "sağlar.")

    T.h(2, "Tablo Önem Skoru ve Büyük Dil Modeli Tabanlı Açıklamalar")
    P("İçe bakış sonucu her tablo için bir önem katsayısı hesaplanır. Bu katsayı, "
      "tablonun yaklaşık satır sayısının logaritmasıdır: importance = log₁₀(satır + 1). "
      "Logaritmik ölçek, büyük tablolara daha fazla ağırlık verirken ölçek farklarını "
      "ezici hâle gelmekten alıkoyar; böylece milyonlarca satırlı bir tablo, birkaç "
      "yüz satırlı bir tablodan daha önemli sayılır ancak bu önem orantısız biçimde "
      "büyümez. Önem katsayısı, getirim aşamasında aday tabloların yeniden "
      "sıralanmasında kullanılır (Bölüm 4.5): genellikle gerçek veriyi taşıyan büyük "
      "olgu (fact) tabloları, küçük yardımcı tablolardan önce gelir.")
    P("Getirim kalitesini artırmanın bir diğer yolu, her tablonun ne işe yaradığını "
      "anlamsal olarak zenginleştirmektir. Bu amaçla, indeksleme sırasında her tablo "
      "için büyük dil modeliyle kısa (en fazla iki satır, 240 karakter) bir amaç "
      "açıklaması üretilir. Bu açıklama, tablonun adından ve kolonlarından çıkarımla, "
      "“bu tablo ne tür veri tutar” sorusuna yanıt verir ve kullanıcının doğal dil "
      "sorularıyla eşleşmeyi kolaylaştırır. Açıklama hiçbir yere kalıcı yazılmaz; "
      "yalnızca tablonun arama belgesine (content) eklenerek gömme kalitesini "
      "yükseltmek için kullanılır. Yüzlerce tabloda zaman aşımı yaşanmaması için bu "
      "üretimler sınırlı eşzamanlılıkla paralel yürütülür ve bir tablonun açıklaması "
      "üretilemese bile o tablo açıklamasız olarak indekslenmeye devam eder.")

    T.h(2, "İndeksleme: content ve schema_text Ayrımı")
    P("İçe bakış tamamlandığında, db-service her tablo için bir indeksleme yükü "
      "oluşturup yapay zeka servisine gönderir; yapay zeka servisi bunları Weaviate’in "
      "DbTable koleksiyonuna yazar. Tasarımın püf noktası, her tablo objesinde iki "
      "farklı metin alanının bulunmasıdır: content ve schema_text (Şekil 4.3). "
      "Bu ikisinin rolleri ve işlenişi birbirinden farklıdır (Çizelge 4.1).")
    T.figure("fig_4_3_object.png",
             "Şekil 4.3 Bir DbTable objesinde content ve schema_text alanları",
             width_cm=14.0)
    T.table_caption("Çizelge 4.1 content ve schema_text alanlarının karşılaştırması")
    T.table([
        ["Özellik", "content", "schema_text"],
        ["İçerik", "Tablo adı + kolon adları + yabancı anahtarlar + amaç açıklaması",
         "Kolonların tip ve PK/FK ile yapılandırılmış bloğu"],
        ["Vektörlenir mi?", "Evet (text2vec-openai)", "Hayır (yalnızca saklanır)"],
        ["Amaç", "Arama / gömme için anlamsal belge", "Sorgu anında modele verilen şema"],
        ["Kullanım anı", "İndeksleme + getirim", "SQL üretimi"],
    ], widths_cm=[2.8, 5.4, 5.4], font_size=9)
    P("Bu ayrım, getirim ile üretim ihtiyaçlarını birbirinden bağımsız olarak "
      "eniyilemeyi sağlar. content alanı, doğal dil sorularıyla eşleşmeyi kolaylaştıran "
      "zengin, insan-okur bir belge olacak biçimde tasarlanır ve vektörlenir; "
      "schema_text alanı ise modele birebir verilecek, tipleri ve anahtarları içeren "
      "kesin bir şema bloğudur ve aramaya katılmadığından gömme maliyeti doğurmaz. "
      "Bir veri tabanı yeniden indekslendiğinde, o veri tabanına ait eski objeler "
      "önce silinip yenileri toplu olarak yazılır; böylece indeks her zaman güncel "
      "şemayı yansıtır.")

    T.h(2, "Melez Arama ile Aday Getirimi ve Yeniden Sıralama")
    P("Sorgu anı hattı, kullanıcının sorusuyla başlar (Şekil 4.2). İlk adımda, soru "
      "yalnızca ilgili veri tabanına ait objelerle sınırlandırılmış bir melez arama "
      "(BM25 + vektör, α = 0,5) ile DbTable koleksiyonunda aranır. Arama, geniş bir "
      "aday kümesi (varsayılan 30 tablo) döndürür. Bu aday genişliği, ilgili tabloların "
      "elenmemesi için bilinçli olarak yüksek tutulur; getirimde öncelik, kesinlikten "
      "(precision) çok kapsamadır (recall).")
    T.figure("fig_4_2_query.png",
             "Şekil 4.2 Sorgu anı getirim ve SQL üretim akışı", width_cm=12.5)
    P("İkinci adımda aday tablolar, içe bakışta hesaplanan önem katsayısına göre "
      "azalan sırada yeniden sıralanır ve yalnızca üst sıradaki tablolar (varsayılan "
      "10 tablo) seçilir. Seçilen tabloların schema_text blokları birleştirilerek, "
      "modele verilecek nihai şema metni (db_scheme) oluşturulur. Böylece model, tüm "
      "şema yerine yalnızca soruya alakalı ve önem sırasına göre seçilmiş, "
      "yönetilebilir büyüklükte bir şema alt kümesi görür. Eğer ilgili veri tabanı "
      "için indekslenmiş hiçbir tablo bulunamazsa (örneğin içe bakış henüz "
      "tamamlanmamışsa), sistem hata üreterek kullanıcıyı bilgilendirir.")

    T.h(2, "Soru Çözümleme: Üç Durumlu Sınıflandırma")
    P("Seçilen şema elde edildikten sonra, SQL üretiminden önce kullanıcının sorusu "
      "bir çözümleyici (analyzer) tarafından üç durumdan birine sınıflandırılır "
      "(Şekil 4.4, Çizelge 4.2). Bu adım, her sorunun körü körüne SQL’e "
      "çevrilmesini engeller ve kullanıcıya daha anlamlı yanıtlar verilmesini sağlar.")
    T.figure("fig_4_4_cases.png",
             "Şekil 4.4 Soru çözümleyicinin üç durumlu karar şeması", width_cm=13.5)
    T.table_caption("Çizelge 4.2 Soru çözümleyicinin durumları ve davranışı")
    T.table([
        ["Durum", "Tanım", "Sistem Davranışı"],
        ["CASE 1", "Soru, seçilen şema ile yanıtlanabilir",
         "Soru netleştirilir ve SELECT sorgusu üretilir"],
        ["CASE 2", "Soru veri tabanıyla ilgili ama veri şemada yok / şemayı anlama isteği",
         "Eksik verinin açıklaması ve yanıtlanabilir bir soru önerisi sunulur"],
        ["CASE 3", "Soru veri tabanıyla tamamen ilgisiz (genel bilgi)",
         "Soru doğrudan yanıtlanır ve yanıtın veri tabanından bağımsız olduğu belirtilir"],
    ], widths_cm=[1.8, 5.6, 5.6], font_size=9)
    P("Çözümleyici, kararını yapılandırılmış bir JSON çıktısı olarak üretir; bu "
      "çıktıda durum numarası, kısa bir gerekçe, gerekiyorsa sorunun netleştirilmiş "
      "biçimi, kullanıcıya gösterilecek mesaj ve önerilen soru yer alır. Çözümleyici, "
      "tüm metin alanlarını kullanıcının sorusuyla aynı dilde üretir; böylece "
      "Türkçe sorulan bir soruya Türkçe, İngilizce sorulan bir soruya İngilizce yanıt "
      "verilir. Tasarımın önemli bir ilkesi, çözümleyicinin asla var olmayan tablo "
      "veya kolon uydurmaması ve yalnızca verilen şemada gerçekten bulunan yapılarla "
      "yanıtlanabilen soruları CASE 1 saymasıdır.")

    T.h(2, "SQL Üretimi ve Güvenlik Kısıtları")
    P("Soru CASE 1 olarak sınıflandırıldığında, netleştirilmiş soru ve seçilen şema, "
      "SQL üretim servisine iletilir. Üretim, katı kurallar içeren bir sistem istemiyle "
      "yönlendirilir. Bu kurallar; çıktının yalnızca tek bir SELECT ifadesi olmasını, "
      "tüm tablo adlarının şema önekiyle nitelenmesini (örneğin public.users), sorgunun "
      "noktalı virgülle bitmesini, hiçbir açıklama, kod bloğu veya markdown "
      "içermemesini ve seçilen her kolona kullanıcının sorusuyla aynı dilde bir takma "
      "ad (alias) verilmesini şart koşar.")
    P("En kritik kural, INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE ve CREATE gibi "
      "veri değiştirici veya şema değiştirici ifadelerin kesinlikle yasaklanmasıdır. "
      "Bu, sistemin güvenlik modelinin temel taşıdır: kullanıcının veri tabanı "
      "üzerinde yalnızca okuma işlemleri yapılabilir; üretilen hiçbir sorgu veriyi "
      "değiştiremez veya silemez. Böylece, dil modelinin beklenmedik bir çıktı üretmesi "
      "durumunda dahi kullanıcının verisi yıkıcı işlemlere karşı korunmuş olur. Bu "
      "kısıtın istem düzeyinde dayatılması, aracının yalnızca okuma yetkili bir veri "
      "tabanı kullanıcısıyla çalıştırılması gibi çalıştırma düzeyi önlemlerle de "
      "desteklenebilir.")

    T.h(2, "Sorgu Düzeltme ve Grafik Önerisi")
    P("Üretilen bir sorgu, kullanıcının veri tabanında çalıştırıldığında çeşitli "
      "nedenlerle (örneğin küçük bir sözdizimi farkı veya veri tabanı lehçesine özgü "
      "bir ayrıntı) hata verebilir. Bu durumu ele almak için sistem, hatalı sorguyu, "
      "veri tabanının döndürdüğü hata mesajını ve şemayı birlikte kullanarak düzeltilmiş "
      "bir SELECT sorgusu üreten bir sorgu düzeltme (fix-query) yeteneğine sahiptir. "
      "Bu, sistemin kendi kendini düzeltme (self-correction) kabiliyeti olarak "
      "değerlendirilebilir ve uçtan uca başarımı artırır.")
    P("Sorgu sonuçları elde edildiğinde, bunların kullanıcıya yalnızca tablo olarak "
      "değil; uygun olduğunda görsel bir grafik olarak da sunulması faydalıdır. Yapay "
      "zeka servisi, sonuç yapısını inceleyerek hangi grafik türünün (örneğin çubuk, "
      "çizgi veya pasta) anlamlı olacağına dair bir öneri (chart hint) üretir. Böylece "
      "doğal dil sorusu, yalnızca ham veriyle değil; doğrudan yorumlanabilir bir "
      "görselleştirmeyle yanıtlanabilir.")

    T.h(2, "RASL ile Karşılaştırma")
    P("QueryLens’in getirim-destekli şema bağlama hattı, RASL yaklaşımından doğrudan "
      "ilham almakla birlikte, gerçek bir SaaS ürününün gereksinimlerine uyarlanmış "
      "bazı farklar içerir (Çizelge 4.3). Ortak nokta, her ikisinin de şemayı ayrık "
      "getirim birimlerine ayırması, bu birimleri bir vektör veri tabanında "
      "indekslemesi, sorgu anında yalnızca ilgili birimleri getirmesi ve alana özgü "
      "ince ayar gerektirmemesidir.")
    T.table_caption("Çizelge 4.3 RASL yaklaşımı ile QueryLens uyarlamasının karşılaştırması")
    T.table([
        ["Boyut", "RASL (Amazon, 2025)", "QueryLens (bu çalışma)"],
        ["Getirim birimi", "Bileşen düzeyinde ayrık birimler (tablo, kolon vb.)",
         "Tablo düzeyinde birim (content + schema_text)"],
        ["Getirim yöntemi", "Çok bileşenli getirim + tür kalibrasyonu",
         "Melez arama (BM25 + vektör, α = 0,5)"],
        ["Sıralama", "Varlık-tür alaka kalibrasyonu",
         "Önem katsayısı (log₁₀(satır+1)) ile yeniden sıralama"],
        ["Bağlam", "Akademik kıyaslama / kurumsal katalog",
         "Çok kullanıcılı SaaS, kullanıcının kendi DB’si"],
        ["Güvenlik / dağıtım", "Yöntem odaklı",
         "SELECT-only, aracı tabanlı erişim, mikroservis dağıtımı"],
    ], widths_cm=[2.6, 5.2, 5.2], font_size=9)
    P("Temel fark, QueryLens’in getirimi tablo düzeyinde tutması ve sıralamayı, "
      "kolon-tür kalibrasyonu yerine veriden türetilen bir önem katsayısıyla "
      "yapmasıdır. Bu, hem gerçekleştirimi sadeleştirir hem de getirilen tablo "
      "sayısını öngörülebilir bir bağlam bütçesi içinde tutar. Ayrıca QueryLens, "
      "yöntemi salt bir getirim tekniği olarak değil; kimlik doğrulama, aracı tabanlı "
      "güvenli erişim, soru çözümleme ve güvenli SQL üretimini içeren bütünleşik bir "
      "ürün olarak sunarak yaklaşımı gerçek kullanıma taşır.")

    # ══════════════════════════════════════════════════════════════════════════
    # 5. GERÇEKLEŞTİRİM
    # ══════════════════════════════════════════════════════════════════════════
    T.h(1, "GERÇEKLEŞTİRİM", brk=True)
    P("Bu bölüm, önceki bölümlerde tasarımı anlatılan sistemin gerçekleştirim "
      "ayrıntılarını sunar. Önce teknoloji yığını özetlenir; ardından yapay zeka "
      "servisi, içe bakış servisi ve konteynerleştirme/dağıtım ele alınır.")

    T.h(2, "Teknoloji Yığını")
    P("Platform, her bileşenin gereksinimlerine en uygun teknolojiyle geliştirildiği "
      "çok-teknolojili (polyglot) bir yapıya sahiptir. Yapay zeka katmanı, hızlı "
      "geliştirme ve zengin makine öğrenmesi ekosistemi nedeniyle Python ile, "
      "FastAPI çatısı ve LangChain kütüphanesi üzerine kurulmuştur. Çekirdek iş "
      "servisleri (kimlik, kullanıcı, veri tabanı, geçit), olgun kurumsal "
      "ekosistemi ve güçlü güvenlik çatısı nedeniyle Java ve Spring Boot ile "
      "geliştirilmiştir. Ön yüz, bileşen tabanlı ve tepkisel bir arayüz için React "
      "ve Vite ile, aracı ise eşzamansız giriş/çıkış için doğal bir uyum sağlayan "
      "Node.js ile gerçeklenmiştir. Vektör arama için Weaviate, hız sınırlama için "
      "Redis ve kalıcı veri için PostgreSQL kullanılmıştır.")

    T.h(2, "Yapay Zeka Servisi (Fast-Service)")
    P("Yapay zeka servisi, FastAPI üzerinde çalışan ve büyük dil modeline erişimi "
      "tek bir noktada toplayan (singleton sağlayıcı) bir servistir. Servis, "
      "sorumlulukları ayrı yönlendirici (router) ve servis katmanlarına bölen temiz "
      "bir katmanlı mimari izler. Başlıca uç noktalar; tablo metadata’sını "
      "indeksleyen indeksleme yönlendiricisi, soruyu çözümleyip SQL üreten sorgu "
      "yönlendiricisi ve grafik önerisi üreten grafik yönlendiricisidir. Servis "
      "ayağa kalkarken Weaviate koleksiyonunun varlığını güvence altına alır; "
      "Weaviate’e erişilemese bile servis çalışmaya devam eder ve hatayı sorgu "
      "anında ele alır. Tüm beklenmedik durumlar, tutarlı bir API yanıt biçimine "
      "dönüştüren genel istisna işleyicileriyle yönetilir.")
    P("İndeksleme uç noktası, db-service’ten gelen tablo listesini alır; her tablo "
      "için kısa amaç açıklamasını sınırlı eşzamanlılıkla üretir, bunları content "
      "alanına ekler ve Weaviate’e toplu olarak yazar. Sorgu uç noktası ise melez "
      "aramayı çalıştırır, soruyu çözümler ve duruma göre SQL üretir veya kullanıcı "
      "mesajı döndürür. Bu katmanlı tasarım, getirim, çözümleme ve üretim "
      "sorumluluklarının birbirinden bağımsız olarak test edilip geliştirilebilmesini "
      "sağlar.")

    T.h(2, "Veri Tabanı İçe Bakış Servisi (db-service)")
    P("İçe bakış mantığı, db-service içinde Java ile gerçeklenmiştir. Servis, veri "
      "tabanı doğrulama olayını eşzamansız bir olay dinleyicisiyle yakalar ve içe "
      "bakışı arka planda yürüterek WebSocket işleyicisini bloke etmez. İçe bakış "
      "sorguları, doğrudan bir JDBC bağlantısıyla değil; aracı üzerinden WebSocket "
      "ile çalıştırılır; çünkü veri tabanına erişim yalnızca kullanıcının "
      "ortamındadır. Veri tabanı türüne özgü metadata sorguları ayrı bir bileşende "
      "(SchemaMetadataQueries) toplanmış, şema metni üretimi ise ayrı bir bileşene "
      "(SchemaTextBuilder) ayrılmıştır. Bu ayrıştırma, yeni veri tabanı türlerinin "
      "(örneğin MySQL, MSSQL) desteklenmesini kolaylaştırır.")
    P("Çıkarılan metadata, ColumnEntity ve TableEntity olarak ilişkisel biçimde "
      "saklanır; ardından her tablo için bir indeksleme yükü oluşturulup yapay zeka "
      "servisine gönderilir. Bu yük, gömme için content belgesini ve modele birebir "
      "verilecek schema_text bloğunu içerir. Böylece içe bakış, yalnızca şemayı "
      "çıkarmakla kalmaz; getirim hattının ihtiyaç duyduğu iki temsili de hazırlar.")

    T.h(2, "Konteynerleştirme ve Dağıtım")
    P("Tüm bileşenler Docker ile konteynerleştirilmiş ve tek bir Docker Compose "
      "tanımıyla bir araya getirilmiştir. Bu tanım; üç PostgreSQL örneğini, Redis’i, "
      "Weaviate’i ve tüm uygulama servislerini ortak bir ağ üzerinde tanımlar. "
      "Servisler arası bağımlılıklar (örneğin geçidin diğer servislere, yapay zeka "
      "servisinin Weaviate’e bağımlılığı) açıkça belirtilmiştir. Bu yaklaşım, tüm "
      "platformun tek bir komutla ayağa kaldırılabilmesini sağlayarak hem "
      "geliştirme hem de dağıtım sürecini büyük ölçüde basitleştirir. Yapılandırma; "
      "OpenAI anahtarı, JWT gizi ve veri tabanı parolaları gibi hassas değerlerin "
      "ortam değişkenleriyle dışarıdan verildiği, on iki faktör (twelve-factor) "
      "ilkelerine uygun bir biçimde tasarlanmıştır.")

    # ══════════════════════════════════════════════════════════════════════════
    # 6. DEĞERLENDİRME VE ÖRNEK SENARYOLAR
    # ══════════════════════════════════════════════════════════════════════════
    T.h(1, "DEĞERLENDİRME VE ÖRNEK SENARYOLAR", brk=True)
    P("Bu bölüm, geliştirilen sistemi niteliksel olarak değerlendirir ve üç temsil "
      "edici örnek senaryo üzerinden davranışını gösterir. Değerlendirme, sayısal "
      "kıyaslama yerine; tasarımın hedeflenen sorunları nasıl ele aldığına ve gerçek "
      "kullanımdaki davranışına odaklanır.")

    T.h(2, "Değerlendirme Yöntemi")
    P("Sistemin değerlendirilmesinde niteliksel bir yaklaşım benimsenmiştir. Bunun "
      "başlıca nedeni, çalışmanın katkısının yeni bir model veya algoritma değil; "
      "var olan tekniklerin (büyük dil modeli, getirim, vektör arama) gerçek bir "
      "ürün içinde uçtan uca bütünleştirilmesi olmasıdır. Bu nedenle değerlendirme; "
      "(i) sistemin temsili sorulara verdiği yanıtların incelendiği örnek "
      "senaryolar ve (ii) tasarım kararlarının hedeflenen sorunları (ölçeklenme, "
      "güvenlik, anlamlı yanıt) ne ölçüde çözdüğünün tartışıldığı niteliksel "
      "değerlendirme üzerinden yürütülmüştür.")

    T.h(2, "Örnek Senaryo 1: Veri Tabanından Yanıtlanabilen Soru (CASE 1)")
    P("İlk senaryo, tipik bir analitik soruyu ele alır. Bir e-ticaret veri tabanına "
      "bağlı kullanıcı, “geçen ay en çok harcama yapan 5 müşteriyi göster” sorusunu "
      "sorar. Sistemin bu soruyu işleme adımları Şekil 6.1’de özetlenmiştir.")
    T.figure("fig_6_1_scenario.png",
             "Şekil 6.1 Örnek senaryo 1’in uçtan uca işlenme akışı", width_cm=15.5)
    P("Melez arama, yüzlerce tablo arasından soruya en alakalı olanları (örneğin "
      "müşteriler, siparişler ve sipariş kalemleri tablolarını) getirir ve bunlar "
      "önem katsayısına göre sıralanır. Çözümleyici soruyu CASE 1 olarak "
      "sınıflandırır; ardından SQL üretim servisi, yalnızca seçilen tabloların "
      "şemasını kullanarak ilgili tabloları birleştiren (JOIN), müşteri başına "
      "toplam harcamayı gruplayan (GROUP BY) ve en yüksek beş sonucu sınırlayan "
      "(LIMIT 5) bir SELECT sorgusu üretir. Sorgu aracıya iletilir, kullanıcının "
      "veri tabanında çalıştırılır ve sonuç hem tablo hem de uygun bir grafikle "
      "kullanıcıya sunulur. Bu senaryo, getirim-destekli yaklaşımın devasa bir şemada "
      "dahi doğru tabloları seçip çalıştırılabilir bir sorgu ürettiğini gösterir.")

    T.h(2, "Örnek Senaryo 2: Şemada Karşılığı Olmayan Soru (CASE 2)")
    P("İkinci senaryoda kullanıcı, veri tabanıyla ilgili ancak şemada karşılığı "
      "bulunmayan bir veri talep eder: “müşterilerin doğum tarihlerine göre yaş "
      "dağılımı nedir?” Eğer şemada doğum tarihi veya yaş bilgisi tutan bir kolon "
      "yoksa, sistemin bu soruyu zorla SQL’e çevirmeye çalışması yanlış veya hatalı "
      "bir sorguyla sonuçlanırdı. Bunun yerine çözümleyici soruyu CASE 2 olarak "
      "sınıflandırır; kullanıcıya hangi verinin şemada bulunmadığını açıklar ve "
      "şema ile gerçekten yanıtlanabilecek bir soru önerisi (örneğin “müşterilerin "
      "şehirlere göre dağılımı”) sunar. Bu davranış, sistemin güvenilirliğini ve "
      "kullanıcıyla kurduğu güveni belirgin biçimde artırır.")

    T.h(2, "Örnek Senaryo 3: Veri Tabanıyla İlgisiz Soru (CASE 3)")
    P("Üçüncü senaryoda kullanıcı, veri tabanıyla tamamen ilgisiz bir genel bilgi "
      "sorusu sorar: “suyun kaynama noktası kaç derecedir?” Sistem bu soruyu CASE 3 "
      "olarak sınıflandırır; soruyu doğrudan ve doğru biçimde yanıtlar, ardından bu "
      "yanıtın kullanıcının veri tabanından bağımsız olduğunu açıkça belirtir. "
      "Böylece sistem, yalnızca katı bir SQL üreticisi gibi davranmak yerine; "
      "kullanıcının niyetini anlayan, soruyu reddetmek yerine yardımcı olan bir "
      "yardımcı (assistant) gibi davranır. Bu üç senaryo birlikte, soru çözümleme "
      "katmanının sistemi nasıl daha güvenli ve kullanıcı dostu kıldığını gösterir.")

    T.h(2, "Niteliksel Değerlendirme")
    P("Tasarımın en belirgin katkısı bağlam bütçesi üzerindedir. Tüm şemayı modele "
      "vermek yerine yalnızca soruya alakalı, önem sırasına göre seçilmiş üst "
      "sıradaki tabloların verilmesi, modele gönderilen şema metnini devasa "
      "veri tabanlarında dahi küçük ve sabit bir bütçe içinde tutar (Çizelge 6.1). "
      "Bu, hem büyük dil modeli maliyetini ve gecikmesini düşürür hem de modelin "
      "ilgisiz tablolarla dikkatinin dağılmasını önleyerek doğruluğu artırır.")
    T.table_caption("Çizelge 6.1 Bağlam bütçesi açısından niteliksel karşılaştırma")
    T.table([
        ["Yaklaşım", "Modele verilen şema", "Ölçeklenebilirlik", "Doğruluk eğilimi"],
        ["Tüm şemayı ver", "Tüm tablolar (yüzlerce)", "Bağlam sınırında çöker",
         "İlgisiz tablolarla düşer"],
        ["Getirim-destekli (bu çalışma)", "Yalnızca üst-N ilgili tablo",
         "Şema büyüklüğünden bağımsız", "İlgili bağlamla yükselir"],
    ], widths_cm=[3.4, 3.6, 3.4, 3.4], font_size=9)
    P("Güvenlik açısından, üretilen sorguların yalnızca SELECT ile sınırlandırılması "
      "ve veri tabanı erişiminin kullanıcının kendi ortamındaki aracı üzerinden "
      "yapılması, hassas verinin ve veri bütünlüğünün korunmasını sağlar. "
      "Kullanılabilirlik açısından, soru çözümleme katmanı sayesinde sistem; "
      "yanıtlanabilen soruları çalıştırır, eksik veriyi açıklar ve ilgisiz soruları "
      "yardımcı biçimde yanıtlar. Mimari açıdan ise mikroservis tasarımı, her "
      "bileşenin bağımsız geliştirilip ölçeklenebilmesini ve teknoloji çeşitliliğini "
      "mümkün kılar.")

    T.h(2, "Kısıtlar ve Geçerlilik Tehditleri")
    P("Çalışmanın bazı kısıtları bulunmaktadır. Birincisi, değerlendirme niteliksel "
      "olup standart bir kıyaslama kümesi üzerinde sayısal doğruluk ölçümü "
      "içermemektedir; bu, gelecekte ele alınması gereken önemli bir yöndür. "
      "İkincisi, sistemin doğruluğu büyük ölçüde altta yatan dil modelinin ve "
      "üretilen gömme/açıklamaların kalitesine bağlıdır. Üçüncüsü, getirim "
      "parametreleri (aday sayısı, üst-N, melez arama ağırlığı α) bu çalışmada makul "
      "başlangıç değerlerine sabitlenmiştir; farklı veri tabanları için en uygun "
      "değerlerin ayarlanması ileri çalışma gerektirir. Son olarak, çok karmaşık ve "
      "çok sayıda tabloyu birleştiren sorgularda, tablo düzeyi getiriminin tek başına "
      "yeterli olmayıp kolon düzeyi bağlamayla güçlendirilmesi gerekebilir.")

    # ══════════════════════════════════════════════════════════════════════════
    # 7. GENEL SONUÇLAR VE ÖNERİLER
    # ══════════════════════════════════════════════════════════════════════════
    T.h(1, "GENEL SONUÇLAR VE ÖNERİLER", brk=True)
    P("Bu tezde, kullanıcıların kendi ilişkisel veri tabanlarını bir aracı üzerinden "
      "bağlayıp doğal dil ile sorgulayabildiği QueryLens adlı bir SaaS platformu "
      "tasarlanmış ve gerçeklenmiştir. Çalışmanın merkezinde, büyük dil modelleriyle "
      "doğal dilden SQL üretiminin en önemli ölçeklenme sorunu, yani devasa şema "
      "problemi yer almıştır. Bu sorun, Amazon’un RASL yaklaşımından ilham alan, "
      "getirim-destekli şema bağlama tabanlı bir hat ile çözülmüştür.")
    P("Geliştirilen çözüm, veri tabanı bağlandığında otomatik bir içe bakış yürüterek "
      "her tablonun yapısal metadata’sını çıkarır; her tablo için kısa bir amaç "
      "açıklaması üretir ve bu birimleri bir vektör veri tabanına indeksler. Sorgu "
      "anında, kullanıcının sorusu melez arama ile en alakalı tablolara eşlenir, "
      "tablolar bir önem katsayısıyla yeniden sıralanır ve yalnızca seçilen "
      "tabloların şeması modele verilir. Üretilen sorguların yalnızca SELECT ile "
      "sınırlandırılması ve veri tabanı erişiminin aracı üzerinden yapılması, "
      "güvenliği; üç durumlu soru çözümleme ise kullanılabilirliği güvence altına "
      "alır. Niteliksel değerlendirme ve örnek senaryolar, yaklaşımın bağlam "
      "bütçesini belirgin biçimde küçülttüğünü ve ölçeklenebilir, güvenli bir doğal "
      "dil veri erişimi sağladığını göstermiştir.")
    P("Gelecek çalışmalar için çeşitli yönler önerilebilir. Birincisi, sistemin Spider "
      "gibi standart kıyaslama kümeleri üzerinde sayısal olarak değerlendirilmesi ve "
      "getirim parametrelerinin bu kümeler üzerinde eniyilenmesidir. İkincisi, tablo "
      "düzeyi getiriminin kolon düzeyi şema bağlamayla güçlendirilerek çok tablolu "
      "karmaşık sorgularda başarımın artırılmasıdır. Üçüncüsü, kullanıcı geri "
      "bildirimlerinden öğrenen (örneğin başarılı sorguları örnek olarak yeniden "
      "kullanan) uyarlanabilir bir getirim mekanizmasıdır. Dördüncüsü, melez arama "
      "ağırlığı ve önem katsayısının veri tabanı özelliklerine göre otomatik "
      "ayarlanmasıdır. Son olarak, çok adımlı (konuşma bağlamını koruyan) sorgulama "
      "ve daha zengin görselleştirme yetenekleri, sistemin kullanıcı deneyimini "
      "daha da geliştirebilir.")

    # ══════════════════════════════════════════════════════════════════════════
    # KAYNAKLAR
    # ══════════════════════════════════════════════════════════════════════════
    T.h5("KAYNAKLAR")
    refs = [
        "Amazon Science, (2025), “RASL: Retrieval-Augmented Schema Linking for Massive "
        "Database Text-to-SQL”, arXiv:2507.23104.",
        "Brown, T., Mann, B., Ryder, N. vd. (2020), “Language Models are Few-Shot "
        "Learners”, Advances in Neural Information Processing Systems (NeurIPS), 33: "
        "1877–1901.",
        "Lewis, P., Perez, E., Piktus, A. vd. (2020), “Retrieval-Augmented Generation "
        "for Knowledge-Intensive NLP Tasks”, Advances in Neural Information Processing "
        "Systems (NeurIPS), 33: 9459–9474.",
        "Robertson, S. ve Zaragoza, H. (2009), “The Probabilistic Relevance Framework: "
        "BM25 and Beyond”, Foundations and Trends in Information Retrieval, 3(4): "
        "333–389.",
        "Vaswani, A., Shazeer, N., Parmar, N. vd. (2017), “Attention Is All You Need”, "
        "Advances in Neural Information Processing Systems (NeurIPS), 30: 5998–6008.",
        "Yu, T., Zhang, R., Yang, K. vd. (2018), “Spider: A Large-Scale Human-Labeled "
        "Dataset for Complex and Cross-Domain Semantic Parsing and Text-to-SQL Task”, "
        "Proceedings of EMNLP 2018, 3911–3921.",
    ]
    for r in refs:
        T.para(r, style="DaraltlmMetin")
    T.spacer(1)
    web = [
        "[1] https://www.amazon.science/publications/rasl-retrieval-augmented-schema-"
        "linking-for-massive-database-text-to-sql, Erişim Tarihi: 17 Haziran 2026.",
        "[2] https://arxiv.org/abs/2507.23104, Erişim Tarihi: 17 Haziran 2026.",
        "[3] https://weaviate.io/developers/weaviate, Erişim Tarihi: 17 Haziran 2026.",
        "[4] https://python.langchain.com, Erişim Tarihi: 17 Haziran 2026.",
    ]
    for w in web:
        T.para(w, style="DaraltlmMetin")

    # ══════════════════════════════════════════════════════════════════════════
    # EKLER
    # ══════════════════════════════════════════════════════════════════════════
    T.h5("EKLER")
    T.para("Ek 1\tSistemde Kullanılan Örnek İstemler (Prompt)", style="ListeMetni")
    T.para("Ek 2\tDış Kapak Biçimi", style="ListeMetni")
    T.para("Ek 3\tİç Kapak Biçimi", style="ListeMetni")

    # Ek 1
    T.h6("Ek 1 Sistemde Kullanılan Örnek İstemler")
    P("Aşağıda, sistemin davranışını yönlendiren başlıca sistem istemlerinin "
      "özetlenmiş biçimleri verilmiştir. İstemler, modelin yalnızca güvenli ve "
      "doğru çıktı üretmesini sağlayan katı kurallar içerir.")
    P("SQL üretim istemi (özet): “Bir SQL sorgu üreticisisin. Yalnızca tek bir SELECT "
      "ifadesi üret. Sorgu SELECT ile başlamalı ve noktalı virgülle bitmelidir. Tüm "
      "tablo adları şema önekiyle nitelenmelidir (örn. public.users). INSERT, UPDATE, "
      "DELETE, DROP, ALTER, TRUNCATE, CREATE kullanma. Açıklama, yorum, kod bloğu "
      "ekleme. Her kolona kullanıcının dilinde bir takma ad ver.”", style="DaraltlmMetin")
    P("Soru çözümleme istemi (özet): “Bir veri tabanı sorusu çözümleyicisisin. "
      "Kullanıcının sorusunu verilen şema ile yanıtlanabilirliğine göre üç durumdan "
      "birine sınıflandır (CASE 1/2/3). Asla olmayan tablo veya kolon uydurma. Tüm "
      "metin alanlarını kullanıcının diliyle aynı dilde üret. Yalnızca geçerli JSON "
      "döndür.”", style="DaraltlmMetin")
    P("Tablo açıklama istemi (özet): “Tek bir veri tabanı tablosunun AMACINI çok "
      "kısa açıkla. Tablonun ne tür veri tuttuğunu, doğal dil sorularıyla "
      "eşleşebilecek biçimde anlat. En fazla iki satır ve 240 karakter; kolonları tek "
      "tek listeleme.”", style="DaraltlmMetin")

    # Ek 2 — Dış kapak formatı
    T.h6("Ek 2 Dış Kapak Formatı")
    T.para("YALOVA ÜNİVERSİTESİ", style="DaraltlmMetin")
    T.para("MÜHENDİSLİK FAKÜLTESİ", style="DaraltlmMetin")
    T.para("………………………………. MÜHENDİSLİĞİ BÖLÜMÜ", style="DaraltlmMetin")
    T.para("BİTİRME TEZİ", style="DaraltlmMetin")
    T.para("BİTİRME TEZİ ADI", style="DaraltlmMetin")
    T.para("Adı SOYADI", style="DaraltlmMetin")
    T.para("Adı SOYADI (var ise)", style="DaraltlmMetin")
    T.para("Bitirme Tezi Danışmanı: Unvan, Adı SOYADI", style="DaraltlmMetin")
    T.para("YALOVA, 2026", style="DaraltlmMetin")

    # Ek 3 — İç kapak formatı
    T.h6("Ek 3 İç Kapak Formatı")
    T.para("YALOVA ÜNİVERSİTESİ", style="DaraltlmMetin")
    T.para("MÜHENDİSLİK FAKÜLTESİ", style="DaraltlmMetin")
    T.para("………………………………. MÜHENDİSLİĞİ BÖLÜMÜ", style="DaraltlmMetin")
    T.para("BİTİRME TEZİ ADI", style="DaraltlmMetin")
    T.para("Adı SOYADI — Öğrenci No", style="DaraltlmMetin")
    T.para("Adı SOYADI (var ise) — Öğrenci No", style="DaraltlmMetin")
    T.para("1. Bitirme Tezi Danışmanı:", style="DaraltlmMetin")
    T.para("2. Jüri Üyesi:", style="DaraltlmMetin")
    T.para("3. Jüri Üyesi:", style="DaraltlmMetin")
    T.para("Bitirme Tezinin Dönemi: 2025 – 2026 Bahar Yarıyılı", style="DaraltlmMetin")
