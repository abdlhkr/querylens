# Sorgu Yanıtlama ve Grafikleştirme Yol Haritası

Bu doküman, mevcut doğal dil sorgu akışına aşağıdaki yeni davranışları eklemek için gerekli değişiklikleri repo içindeki gerçek implementasyona göre çıkarır:

1. Kullanıcı sorusu veritabanı ile ilgili değilse, sistem cevabı biliyorsa cevap vermeli ve bu bilginin DB'den gelmediğini açıkça belirtmeli.
2. Kullanıcı sorusu DB ile ilgiliyse ama mevcut şema/veri ile cevap üretilemeyecekse, sistem "şu an veritabanınızdaki bilgilerle bu sonuca varamıyorum" anlamında yönlendirici bir sonuç dönmeli.
3. AI tarafından üretilen yanıtlar ve açıklamalar kullanıcının soruyu sorduğu dille aynı olmalı.
4. Sonuç grafikle gösterilebilecek yapıdaysa, AI hangi alanın kategori/isim/belirteç, hangisinin sayısal değer, hangisinin zaman alanı olduğunu ayrıca belirtmeli.
5. Frontend'de mevcut tablo görünümünün yanında "Grafiğe dönüştür" alanı bulunmalı; grafik tipini kullanıcı seçmeli, AI'ın önerisi başlangıç ayarı olarak kullanılmalı.

## Kapsam

Doğrudan etkilenen katmanlar:

- `Fast-Service`
- `database-initialization`
- `front-app`

Kontrol edilmesi gereken ama muhtemelen sınırlı değişiklik gerektiren katmanlar:

- `gateway-service`
- agent tarafı (`agent/node-websocket-agent`)

## Mevcut Durum

Şu anki akış repo içinde aşağıdaki dosyalarda kurulmuş durumda:

- Fast-Service router: `Fast-Service/routers/query_router.py`
- Fast-Service SQL üretimi: `Fast-Service/services/query_service.py`
- Fast-Service request/response şemaları: `Fast-Service/schemas/query.py`, `Fast-Service/schemas/response.py`
- Java orkestrasyon servisi: `database-initialization/.../service/NaturalLanguageQueryService.java`
- Fast service client: `database-initialization/.../client/FastServiceClient.java`
- Query endpoint: `database-initialization/.../controller/QueryController.java`
- Frontend query ekranı: `front-app/src/pages/app/Query.tsx`
- Frontend veri tipleri: `front-app/src/types/index.ts`
- Frontend API çağrıları: `front-app/src/api/devices.ts`
- Frontend HTTP client: `front-app/src/api/client.ts`

Bugünkü davranış özeti:

1. Frontend doğal dil sorusunu `POST /api/devices/queries/natural-language` ile gönderiyor.
2. `NaturalLanguageQueryService` introspection sonucundan düz metin şema üretiyor.
3. `FastServiceClient.generateSql(...)` Fast-Service `/query/` endpoint'ine gidiyor.
4. Fast-Service yalnızca SQL string döndürüyor.
5. Java servis SQL'i agent üzerinden çalıştırıyor.
6. Başarılıysa tablo verisi dönüyor, başarısızsa self-healing ile `/query/fix` deneniyor.

Bu tasarımın bugünkü sınırları:

- Her soru "mutlaka SQL üretilmeli" varsayımıyla ele alınıyor.
- DB dışı sorular için doğrudan bilgi cevabı üretilemiyor.
- DB ile ilgili ama veri yetersizliği olan sorular ile gerçek SQL hataları birbirinden ayrışmıyor.
- Yanıt dili ayrı bir alan veya zorunlu akış kuralı olarak taşınmıyor.
- Grafik için kolon rolleri üretilmiyor.
- Frontend'de henüz gerçek chart kütüphanesi yok; `front-app/package.json` içinde chart dependency bulunmuyor.

## Hedef Davranış

### 1. DB ile alakasız soru

Örnek:

- Soru: "Dünyanın en yüksek dağı hangisi?"

Beklenen:

- Sistem kullanıcıya doğrudan cevap verir.
- `generatedSql` boş kalır.
- Yanıtta açık bir disclaimer bulunur: bu cevap veritabanından gelmedi.
- `source = llm` veya benzeri bir işaret bulunur.
- Frontend bunu tablo yerine "bilgilendirici yanıt" kartı olarak gösterir.

### 2. DB ile ilgili ama mevcut veriden cevaplanamayan soru

Örnek:

- Soru: "Müşteri portföyüm büyüyor mu?"
- Şemada sadece güncel müşteri listesi var, tarihsel snapshot veya trend verisi yok.

Beklenen:

- Sistem SQL çalıştırmadan önce veya SQL cevabını yorumladıktan sonra veri yetersizliğini ayırt eder.
- Kullanıcıya "mevcut verilerinizle bu sonuca varamıyorum" şeklinde cevap verir.
- İsterse alternatif bir soru veya mevcut veriden görülebilecek yakın sonuç önerir.
- Bu yanıt da kullanıcı diliyle üretilir.

### 3. Yanıt dili

Beklenen:

- Kullanıcı Türkçe sorarsa AI cevabı, disclaimer, öneri ve grafik açıklamaları Türkçe dönmeli.
- Kullanıcı Türkçe dışı bir dilde sorarsa AI cevabı mümkün olduğunca sorunun diliyle dönmeli.
- Hata mesajları frontend tarafından belirlenmeli.
- Türkçe dışındaki tüm hata mesajları İngilizce gösterilmeli.

### 4. Grafik desteği

Beklenen:

- Tablo sonucu geldiğinde AI ayrıca kolon rolleri üretir.
- Frontend sağ tarafta veya sonuç alanının yanında "Grafiğe dönüştür" paneli gösterir.
- Kullanıcı grafik tipini seçer.
- AI önerisi varsayılan mapping olarak uygulanır.
- Kullanıcı isterse dimension/metric/time seçimlerini değiştirebilir.

## Önerilen Üst Seviye Mimari

Mevcut "tek adımda SQL üret" tasarımı yerine iki karar aşamalı model önerilir:

1. Soru yorumlama ve cevap modu belirleme
2. Seçilen moda göre işlem

Önerilen cevap modları:

- `database_query`
- `general_knowledge`
- `insufficient_db_data`

İsteğe bağlı dördüncü mod:

- `database_query_with_explanation`

Bu mod, SQL çalıştırılıp tablo döndürüldükten sonra aynı sonuç için doğal dil açıklama da üretmek istenirse ileride faydalı olabilir.

## Önerilen Response Contract

Bugünkü yapı `sql_query` string'i veya Java tarafında tablo odaklı `NaturalLanguageQueryResponse` dönüyor. Yeni sözleşme daha açık ayrışmalı.

Önerilen Fast-Service yorumlama cevabı:

```json
{
  "mode": "database_query",
  "answer": "Sonuçlar aşağıdadır.",
  "disclaimer": null,
  "source": "database",
  "generatedSql": "SELECT ...;",
  "confidence": 0.91,
  "reasoning": {
    "isDatabaseRelated": true,
    "canBeAnsweredFromAvailableSchema": true
  },
  "chartHints": {
    "visualizationReady": true,
    "recommendedChartType": "bar",
    "dimensionFields": ["region"],
    "metricFields": ["total_sales"],
    "timeFields": []
  }
}
```

DB dışı soru için:

```json
{
  "mode": "general_knowledge",
  "answer": "Dünyanın en yüksek dağı Everest'tir.",
  "disclaimer": "Bu yanıt veritabanınızdan üretilmedi; genel bilgi olarak verildi.",
  "source": "llm",
  "generatedSql": null,
  "confidence": 0.84,
  "reasoning": {
    "isDatabaseRelated": false,
    "canBeAnsweredFromAvailableSchema": false
  },
  "chartHints": {
    "visualizationReady": false,
    "recommendedChartType": "table",
    "dimensionFields": [],
    "metricFields": [],
    "timeFields": []
  }
}
```

DB ile ilgili ama veri yetersizse:

```json
{
  "mode": "insufficient_db_data",
  "answer": "Şu an veritabanınızdaki bilgilerle müşteri portföyünün büyüyüp büyümediği sonucuna varamıyorum.",
  "disclaimer": "Bunu söyleyebilmek için tarihsel müşteri veya dönemsel snapshot verisine ihtiyaç var.",
  "source": "mixed",
  "generatedSql": null,
  "confidence": 0.72,
  "reasoning": {
    "isDatabaseRelated": true,
    "canBeAnsweredFromAvailableSchema": false
  },
  "chartHints": {
    "visualizationReady": false,
    "recommendedChartType": "table",
    "dimensionFields": [],
    "metricFields": [],
    "timeFields": []
  },
  "suggestedFollowups": [
    "Müşteri kayıtlarını aya göre say",
    "Son 12 aydaki müşteri kayıt tarihlerini göster"
  ]
}
```

## Fast-Service Tarafında Gerekli Değişiklikler

### 1. Endpoint tasarımı

Bugünkü endpointler:

- `POST /query/`
- `POST /query/fix`

Öneri:

- `POST /query/interpret`
- `POST /query/generate-sql`
- `POST /query/fix`
- İsteğe bağlı: `POST /query/chart-hints`

Pratikte iki uygulanabilir seçenek var:

### Seçenek A: Tek endpoint içinde yorumla ve cevap üret

Avantaj:

- Daha az network hop
- Java servis daha az parçalı olur

Dezavantaj:

- SQL üretim ve genel cevap mantığı aynı prompt içinde karışabilir
- Test etmek zorlaşır

### Seçenek B: Yorumlama ve SQL üretimini ayır

Avantaj:

- En temiz tasarım
- Failover davranışları daha net
- DB dışı soru ile SQL generation ayrışır

Önerilen yaklaşım: Seçenek B

### 2. Yeni request/response şemaları

Bugünkü dosyalar:

- `Fast-Service/schemas/query.py`
- `Fast-Service/model/query_model.py`

Yeni gerekli modeller:

- `InterpretQueryRequest`
- `InterpretQueryResponse`
- `ChartHints`
- `ReasoningMetadata`

İstenen yeni request alanları:

- `db_type`
- `db_scheme`
- `question`
- `response_mode` opsiyonel

Not:

- Ayrı bir `language` alanı taşınmasına gerek yok.
- Fast-Service yorumlama aşamasında sorunun dilini doğrudan sorudan çıkarmalı.

### 3. Prompt stratejisi

Bugünkü `Fast-Service/services/query_service.py` prompt'u yalnızca "tek bir SELECT sorgusu üret" diyor.

Burada en az iki ayrı servis/prompt olmalı:

- `InterpretationService`
- `SqlGenerationService`

`InterpretationService` görevleri:

- Soru DB ile ilgili mi?
- Şema ve veri erişimi varsayımıyla cevap üretmek mümkün mü?
- Cevap modu ne?
- Sorunun dili ne?
- Kısa cevap/disclaimer ne?
- Grafik üretimi mantıklı mı?

`SqlGenerationService` görevleri:

- Yalnızca `database_query` için SELECT üretmek
- Sıkı SQL güvenlik kurallarını korumak

### 4. Structured output zorunluluğu

Bu değişiklikte serbest metin yerine structured output kullanılmalı. Aksi halde:

- `mode` parsing kırılabilir
- `chartHints` kararsız olur
- dil/disclaimer alanları frontend için güvenilir olmaz

### 5. Grafik ipucu üretimi

Grafik için Fast-Service şu alanları üretmeli:

- `visualizationReady`
- `recommendedChartType`
- `dimensionFields`
- `metricFields`
- `timeFields`
- `seriesFields`
- `title`
- `xAxisLabel`
- `yAxisLabel`

`seriesFields` özellikle şu durumda gerekli:

- `month`, `region`, `sales`
- burada `month` time, `sales` metric, `region` series olabilir

### 6. Fix flow korunmalı

`/query/fix` akışı aynen kalabilir ancak sadece `mode = database_query` ise çalışmalıdır.

Yeni kural:

- `general_knowledge` ise SQL fix yok
- `insufficient_db_data` ise SQL fix yok
- `database_query` ise mevcut self-healing devam eder

### 7. Hata mesajları

Fast-Service hata mesajları şu an Türkçe sabit metin içeriyor. Bunlar da kullanıcı diliyle eşleşmeli.

Öneri:

- Fast-Service kendi internal hata mesajlarını sabit kod + localizable message olarak dönsün
- veya sadece hata kodu dönsün, kullanıcıya gösterilecek metni Java katmanı üretsin

Tercih edilen yaklaşım:

- kullanıcıya gösterilecek final message Java katmanında üretilecek
- Fast-Service daha çok `error_code`, `technical_detail` ve AI cevabı dönecek

## database-initialization Tarafında Gerekli Değişiklikler

Bu katman asıl orkestrasyon merkezi olduğu için en kritik değişiklikler burada.

### 1. QueryController dil header'ı almamalı

Bugünkü `QueryController` yalnızca `X-User-Id` alıyor.

Bu karar korunabilir. Ek `Accept-Language` veya benzeri bir header taşımaya gerek yok.

Yeni kural:

- AI cevabının dili, sorunun kendisinden çıkarılacak.
- Hata mesajlarının dili backend tarafından değil frontend tarafından belirlenecek.
- Türkçe arayüzde hata mesajları Türkçe gösterilecek.
- Türkçe dışındaki tüm arayüzlerde hata mesajları İngilizce gösterilecek.

### 2. NaturalLanguageQueryRequest genişlemeli

Bugünkü DTO:

- sadece `question`

Önerilen yeni alanlar:

- `question`
- `visualizationPreference` opsiyonel

Not:

- Ayrı bir `language` alanına gerek yok.
- Soru dili AI tarafından question metninden anlaşılmalı.

### 3. NaturalLanguageQueryService akışı branşlanmalı

Bugünkü akış:

1. ownership check
2. verified check
3. agent connected check
4. introspection text build
5. SQL generate
6. SQL execute
7. fix loop

Yeni akış:

1. ownership check
2. verified check
3. introspection schema + structured metadata hazırla
4. Fast-Service `interpret` çağrısı yap
5. `mode` değerine göre branch et

Branch davranışları:

- `general_knowledge`
  - agent bağlantısı gerekmez
  - SQL çalıştırılmaz
  - cevap doğrudan döner

- `insufficient_db_data`
  - agent bağlantısı gerekmez
  - SQL çalıştırılmaz
  - yönlendirici cevap döner

- `database_query`
  - agent bağlantısı kontrol edilir
  - SQL generate/fix/execute akışı çalışır
  - chart hints response'a eklenir

Bu çok önemli bir davranış değişikliğidir:

- Bugün agent bağlı değilse doğal dil akışı doğrudan hata dönüyor.
- Yeni modelde DB dışı soru için agent hiç gerekmemeli.

### 4. FastServiceClient yeniden tasarlanmalı

Bugünkü `FastServiceClient.generateSql(...)` sadece `sql_query` bekliyor.

Yeni durumda client aşağıdaki çağrıları yönetmeli:

- `interpret(...)`
- `generateSql(...)`
- `fixSql(...)`

Önerilen yeni DTO'lar:

- `FastServiceInterpretRequest`
- `FastServiceInterpretResponse`
- `FastServiceChartHintsResponse` gerekirse

Map ile parse etmek yerine typed DTO kullanılması önerilir. Çünkü:

- `mode`
- `language`
- `chartHints`
- `suggestedFollowups`

gibi alanlar string-map yaklaşımında kırılgan olur.

### 5. NaturalLanguageQueryResponse genişlemeli

Bugünkü alanlar:

- `databaseId`
- `question`
- `generatedSql`
- `success`
- `data`
- `rowCount`
- `executionTimeMs`
- `error`
- `errorCode`
- `healAttempts`

Önerilen yeni alanlar:

- `mode`
- `answer`
- `source`
- `disclaimer`
- `visualizationReady`
- `chartHints`
- `suggestedFollowups`
- `usedDatabase`
- `usedAgent`

Önerilen anlam:

- `success`: teknik olarak response üretildi mi
- `mode`: cevap tipi ne
- `usedDatabase`: cevap DB verisine dayanıyor mu
- `usedAgent`: websocket agent devreye girdi mi

Bu sayede frontend `success = true` olsa bile `mode = general_knowledge` için tablo beklemez.

### 6. Structured schema summary eklenmeli

Bugün introspection sonucu düz metin olarak birleştiriliyor:

- `Schema: ...`
- `resultText`

Grafik önerisi ve veri yeterliliği tespiti için daha güçlü metadata gerekir.

`IntrospectionResultFormatter` veya yeni bir servis şu yapıyı üretebilir:

```json
{
  "schemas": [
    {
      "name": "public",
      "tables": [
        {
          "name": "orders",
          "columns": [
            { "name": "id", "type": "uuid", "roleHint": "identifier" },
            { "name": "created_at", "type": "timestamp", "roleHint": "time" },
            { "name": "total_amount", "type": "numeric", "roleHint": "metric" },
            { "name": "customer_id", "type": "uuid", "roleHint": "foreign_key" }
          ]
        }
      ]
    }
  ]
}
```

İlk fazda tam JSON şema şart değil, ama en azından aşağıdakiler taşınmalı:

- kolon adı
- veri tipi
- tablo adı
- primary/foreign key ipucu
- nullability

### 7. Mesaj stratejisi

Java tarafında bugün çok sayıda sabit İngilizce mesaj var:

- agent disconnected
- database not verified
- no schema information found
- query execution failed
- validation failed

Yeni karara göre bunların backend'de tam localization alması şart değil.

Yapılması gereken:

- backend mümkün olduğunca stabil `errorCode` dönmeli
- frontend bu `errorCode` değerlerini kullanıcıya gösterilecek mesaja çevirmeli
- Türkçe arayüzde Türkçe mesaj gösterilmeli
- Türkçe dışındaki tüm arayüzlerde İngilizce mesaj gösterilmeli

Bu yaklaşım, çok dilli hata metni yönetimini backend yerine frontend'e taşır.

## Frontend Tarafında Gerekli Değişiklikler

### 1. API client dil header'ı göndermemeli

`front-app/src/api/client.ts` için ek `Accept-Language` taşıma ihtiyacı yok.

Buradaki esas ihtiyaç:

- backend `errorCode` değerlerini alıp frontend içinde uygun metne çevirmek
- Türkçe dışındaki tüm diller için İngilizce fallback kullanmak

### 2. TypeScript tipleri büyümeli

`front-app/src/types/index.ts` içinde `NaturalLanguageQueryResult`, mevcut `QueryResult` kalıtımını aşmış durumda. Çünkü artık her doğal dil sorusu tablo dönmek zorunda değil.

Önerilen yeni tipler:

- `AnswerMode = 'database_query' | 'general_knowledge' | 'insufficient_db_data'`
- `AnswerSource = 'database' | 'llm' | 'mixed'`
- `ChartHints`
- `NaturalLanguageQueryResult` yeniden tanımlanmalı

Önemli:

- `NaturalLanguageQueryResult extends QueryResult` yaklaşımı artık zayıf kalır
- ayrı interface daha doğru olur

Çünkü `general_knowledge` için:

- `requestId`
- `originalQuery`
- `rowCount`
- `executionTimeMs`

anlamsız olabilir

### 3. Query ekranı yeniden modellenmeli

`front-app/src/pages/app/Query.tsx` bugün şu üç şeyi gösteriyor:

- generated SQL
- tablo
- error state

Yeni ekran bileşenleri:

- cevap özeti kartı
- kaynak badge: "DB", "Genel bilgi", "Yetersiz veri"
- disclaimer alanı
- generated SQL alanı yalnızca `database_query` modunda
- suggested followups alanı
- grafik dönüşüm paneli

### 4. Grafik paneli

Beklenen kullanıcı deneyimi:

- sonuç varsa sağ panelde `Grafiğe dönüştür`
- kullanıcı chart type seçer
- AI önerilen mapping ile form ön dolar
- kullanıcı dimension/metric/time seçimini değiştirebilir
- grafik anlık yenilenir

Başlangıç chart tipleri:

- `bar`
- `line`
- `pie`
- `area`
- `scatter`
- `table`

### 5. Chart kütüphanesi eklenmeli

Repo içinde henüz chart dependency görünmüyor. Bir kütüphane seçmek gerekiyor.

Öneri:

- `recharts`

Neden:

- React ile entegrasyonu kolay
- hızlı prototip için yeterli
- table yanında küçük bir side panel kullanımı için uygun

Alternatif:

- `echarts-for-react`

Bu daha güçlü ama ilk faz için daha ağır olabilir.

### 6. Grafik mapping kuralları

Frontend şu fallback kuralları da içermeli:

- `timeFields` varsa varsayılan chart `line`
- tek metric + tek dimension varsa varsayılan `bar`
- tek metric + çok az kategori varsa `pie` opsiyonel
- `chartHints.visualizationReady = false` ise panel disabled veya uyarılı olmalı

### 7. i18n metinleri genişlemeli

`front-app/src/i18n/tr.ts` ve `front-app/src/i18n/en.ts` içine yeni anahtarlar eklenmeli:

- `app.answer_source_db`
- `app.answer_source_llm`
- `app.answer_source_mixed`
- `app.db_not_used`
- `app.insufficient_data`
- `app.suggested_followups`
- `app.convert_to_chart`
- `app.chart_type`
- `app.dimension_field`
- `app.metric_field`
- `app.time_field`
- `app.no_chart_available`

Ek hata kuralı:

- UI dili `tr` ise Türkçe hata mesajı
- UI dili `tr` değilse İngilizce hata mesajı

## gateway-service Tarafında Notlar

Büyük bir iş değişikliği görünmüyor.

Bu karar setine göre `Accept-Language` taşınmayacağı için gateway tarafında dil odaklı ek iş beklenmiyor.

## Agent Tarafında Notlar

Yeni davranış için agent tarafında zorunlu büyük değişiklik görünmüyor. Çünkü:

- `general_knowledge` ve `insufficient_db_data` modlarında agent hiç kullanılmayacak
- `database_query` modunda mevcut query execution akışı korunacak

Olası küçük ihtiyaç:

- chart için örnek veri boyutu veya kolon tipi ile ilgili agent tarafında ek metadata alınmak istenirse ileride genişletilebilir

İlk faz için gerekmez.

## Uygulama Sırası

### Faz 1 - Contract ve yorumlama

Amaç:

- soru tipini ayırmak
- cevap dilini sorudan çıkarmak
- frontend'in yeni response'u anlamasını sağlamak

Yapılacaklar:

1. Fast-Service `interpret` endpoint ve DTO'ları
2. Java `FastServiceClient` typed DTO'lar
3. `NaturalLanguageQueryResponse` genişletme
4. frontend tipleri ve cevap kartı

Teslim çıktısı:

- DB dışı sorular düzgün cevaplanır
- veri yetersizliği mesajı ayrı mode ile döner

### Faz 2 - Frontend hata mesajı eşleme

Amaç:

- hata mesajlarını frontend üzerinden tutarlı göstermek

Yapılacaklar:

1. backend `errorCode` kapsamını netleştirme
2. frontend `errorCode -> message` eşleme tablosu
3. Türkçe için yerel hata metinleri
4. Türkçe dışı tüm diller için İngilizce fallback

Teslim çıktısı:

- hata metinleri frontend'de kontrollü ve öngörülebilir hale gelir

### Faz 3 - Grafik paneli

Amaç:

- tablo sonucunu frontendde grafiğe dönüştürmek

Yapılacaklar:

1. chart library ekleme
2. `chartHints` sözleşmesi
3. Query ekranında side panel
4. kullanıcı seçilebilir chart type
5. field mapping formu

Teslim çıktısı:

- tablo sonucu chart'a dönüştürülebilir

### Faz 4 - İyileştirme ve guardrail

Amaç:

- yanlış sınıflandırmaları azaltmak
- güvenilirliği artırmak

Yapılacaklar:

1. telemetry/logging
2. yanlış mode örneklerini toplama
3. prompt tuning
4. gerekiyorsa second-pass verification

## Önerilen Dosya Bazlı Değişiklik Listesi

### Fast-Service

- `Fast-Service/routers/query_router.py`
- `Fast-Service/services/query_service.py`
- `Fast-Service/services/fix_query_service.py`
- `Fast-Service/schemas/query.py`
- `Fast-Service/schemas/response.py`
- yeni dosyalar:
  - `Fast-Service/schemas/interpret.py`
  - `Fast-Service/services/interpretation_service.py`
  - `Fast-Service/schemas/chart.py`

### database-initialization

- `database-initialization/.../controller/QueryController.java`
- `database-initialization/.../service/NaturalLanguageQueryService.java`
- `database-initialization/.../client/FastServiceClient.java`
- `database-initialization/.../dto/query/NaturalLanguageQueryRequest.java`
- `database-initialization/.../dto/query/NaturalLanguageQueryResponse.java`
- `database-initialization/.../service/IntrospectionResultFormatter.java`
- yeni dosyalar:
  - `.../dto/query/ChartHintsDto.java`
  - `.../dto/query/AnswerMode.java`
  - `.../dto/query/AnswerSource.java`

### front-app

- `front-app/src/api/client.ts`
- `front-app/src/api/devices.ts`
- `front-app/src/types/index.ts`
- `front-app/src/pages/app/Query.tsx`
- `front-app/src/pages/app/Query.css`
- `front-app/src/i18n/tr.ts`
- `front-app/src/i18n/en.ts`
- yeni dosyalar:
  - `front-app/src/components/query/AnswerSummary.tsx`
  - `front-app/src/components/query/ChartPanel.tsx`
  - `front-app/src/components/query/ResultTable.tsx`
  - `front-app/src/components/query/charts/...`

## Test Senaryoları

Zorunlu acceptance test listesi:

1. Türkçe DB dışı soru
   Beklenen: Türkçe cevap, `mode=general_knowledge`, `generatedSql=null`

2. İngilizce DB dışı soru
   Beklenen: İngilizce cevap, DB disclaimer İngilizce

3. Türkçe DB içi ve cevaplanabilir soru
   Beklenen: `mode=database_query`, SQL oluşur, tablo döner

4. İngilizce DB içi ve cevaplanabilir soru
   Beklenen: İngilizce answer/disclaimer, tablo aynı

5. DB içi ama veri yetersiz soru
   Beklenen: `mode=insufficient_db_data`, SQL çalışmaz

6. Agent disconnected + DB dışı soru
   Beklenen: yine cevap döner, agent hatası dönmez

7. Agent disconnected + DB içi soru
   Beklenen: yalnızca `database_query` modunda agent uyarısı dönmeli

8. Grafik hazır tek dimension + tek metric sonuç
   Beklenen: chart panel aktif, önerilen chart type dolu

9. Zaman serisi sonuç
   Beklenen: `timeFields` dolu, varsayılan line chart

10. Backend validation error
   Beklenen: frontend Türkçe ise Türkçe, diğer tüm dillerde İngilizce mesaj

## Riskler ve Dikkat Noktaları

### 1. Yanlış sınıflandırma riski

Model bazen DB ile ilgili bir soruyu genel bilgi gibi sınıflandırabilir. Bu yüzden:

- `reasoning.isDatabaseRelated`
- `reasoning.canBeAnsweredFromAvailableSchema`

alanları loglanmalı.

### 2. Şema var, veri yok problemi

Fast-Service şemaya bakarak bir sorunun cevaplanabilir olduğunu düşünebilir ama gerçekte veri yetersiz olabilir.

Bu yüzden iki aşamalı yaklaşım daha güvenlidir:

- pre-check: şemadan tahmin
- post-check: SQL sonucu boş/uygunsuzsa ikinci yorum

İlk fazda yalnızca pre-check yapılabilir, ama ikinci fazda post-check eklenmesi önerilir.

### 3. Hata ve cevap dili birbirine karışabilir

Bu tasarımda iki ayrı kural birlikte yürür:

- AI answer/disclaimer/follow-up metinleri sorunun dilinde üretilir
- sistem hata mesajları frontend tarafından çevrilir

Bu ayrım dokümanda ve implementasyonda açık tutulmalıdır.

### 4. Grafik yanlış eşlenebilir

Kolon adı numerik olsa bile aslında identifier olabilir. Örnek:

- `customer_id`
- `order_no`

Bu yüzden AI'a sadece veri tipi değil kolon adı semantiği de verilmeli.

## Karar Önerileri

Uygulamaya başlamadan önce aşağıdaki kararlar netleştirilmeli:

1. Fast-Service tek endpoint mi olacak, yoksa `interpret + generate-sql` olarak mı ayrılacak?
   Öneri: ayrılsın.

2. Dil bilgisi ayrı header/body alanıyla mı taşınacak?
   Öneri: hayır, taşınmasın; AI sorudan çıkarsın.

3. Chart kütüphanesi ne olacak?
   Öneri: `recharts`.

4. `general_knowledge` cevapları her zaman serbest mi olacak, yoksa ürün tonu için şablon disclaimer zorunlu mu olacak?
   Öneri: disclaimer zorunlu olsun.

## Sonuç

Bu değişiklik, mevcut NL->SQL akışını "her şeyi SQL'e çevir" yaklaşımından çıkarıp "önce soruyu anla, sonra doğru modda cevap ver" yaklaşımına taşıyor.

En kritik teknik değişiklikler şunlar:

- Fast-Service'in structured interpretation üretmesi
- Java servisinin mode tabanlı orkestrasyona geçmesi
- frontend'in tablo dışındaki cevap tiplerini first-class citizen olarak göstermesi
- hata mesajı dilinin frontend'de yönetilmesi
- chart hints sözleşmesinin response'a eklenmesi

En doğru başlangıç sırası:

1. response contract
2. interpretation flow
3. frontend hata mesajı eşleme
4. chart UI
