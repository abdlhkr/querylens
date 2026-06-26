# -*- coding: utf-8 -*-
"""
Tez şekillerini üretir (matplotlib). Tüm çıktılar thesis_build/figures/ altına PNG.
Kutu-ok tabanlı temiz, serif diyagramlar. Word'e ŞekilYazısı ile gömülecek.
"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from matplotlib.lines import Line2D

plt.rcParams.update({
    "font.family": "serif",
    "font.serif": ["DejaVu Serif", "Liberation Serif", "Times New Roman"],
    "font.size": 11,
})

OUT = os.path.join(os.path.dirname(__file__), "figures")
os.makedirs(OUT, exist_ok=True)

# Renk paleti (yumuşak, baskıda da okunur)
C = {
    "blue":   "#dbe7f3",
    "green":  "#dff0df",
    "orange": "#fbe6cf",
    "purple": "#e8e0f2",
    "gray":   "#ececec",
    "yellow": "#fbf3cf",
    "red":    "#f6dcdc",
}
EDGE = "#2b2b2b"


def box(ax, x, y, w, h, text, color="gray", fs=10, bold=False, rounded=0.02):
    p = FancyBboxPatch((x, y), w, h,
                       boxstyle=f"round,pad=0.01,rounding_size={rounded}",
                       linewidth=1.2, edgecolor=EDGE, facecolor=C.get(color, color))
    ax.add_patch(p)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
            fontsize=fs, fontweight="bold" if bold else "normal", wrap=True)
    return (x + w / 2, y + h / 2, w, h)


def arrow(ax, p1, p2, text=None, style="-|>", color=EDGE, ls="-", rad=0.0, fs=8):
    a = FancyArrowPatch(p1, p2, arrowstyle=style, mutation_scale=14,
                        linewidth=1.1, color=color, linestyle=ls,
                        connectionstyle=f"arc3,rad={rad}")
    ax.add_patch(a)
    if text:
        mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
        ax.text(mx, my, text, ha="center", va="center", fontsize=fs,
                bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.85))


def setup(w=10, h=6):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")
    return fig, ax


def save(fig, name):
    path = os.path.join(OUT, name)
    fig.savefig(path, dpi=180, bbox_inches="tight", pad_inches=0.1)
    plt.close(fig)
    print("yazildi:", name)


# --- Şekil 1.1 Text-to-SQL genel akış -----------------------------------------
def fig_1_1():
    fig, ax = setup(11, 2.6)
    y, h, w = 38, 26, 17
    b1 = box(ax, 2, y, w, h, "Doğal Dil\nSorusu", "blue", bold=True)
    b2 = box(ax, 26, y, w, h, "Yapay Zeka\nÇeviri Katmanı\n(LLM)", "orange", bold=True)
    b3 = box(ax, 50, y, w, h, "SQL\nSorgusu", "green", bold=True)
    b4 = box(ax, 74, y, w, h, "Veritabanı\n→ Sonuç", "purple", bold=True)
    arrow(ax, (19, y + h / 2), (26, y + h / 2))
    arrow(ax, (43, y + h / 2), (50, y + h / 2))
    arrow(ax, (67, y + h / 2), (74, y + h / 2))
    ax.text(50, 92, "\"En çok satan 5 ürün hangisi?\"", ha="center", fontsize=10, style="italic")
    save(fig, "fig_1_1_text2sql.png")


# --- Şekil 2.1 RAG genel mimari -----------------------------------------------
def fig_2_1():
    fig, ax = setup(10, 5)
    box(ax, 3, 70, 22, 16, "Kullanıcı\nSorusu", "blue", bold=True)
    box(ax, 39, 70, 24, 16, "Getirici\n(Retriever)", "orange", bold=True)
    box(ax, 74, 68, 23, 20, "Vektör\nVeritabanı", "purple", bold=True)
    box(ax, 39, 38, 24, 16, "İlgili Bağlam\n(Context)", "green", bold=True)
    box(ax, 39, 6, 24, 16, "LLM\n(Üretici)", "orange", bold=True)
    box(ax, 74, 6, 23, 16, "Yanıt / SQL", "yellow", bold=True)
    arrow(ax, (25, 78), (39, 78))
    arrow(ax, (63, 78), (74, 78), "benzerlik\naraması", rad=0.0)
    arrow(ax, (74, 74), (63, 74), "aday\nbelgeler", rad=0.0)
    arrow(ax, (51, 70), (51, 54))
    arrow(ax, (51, 38), (51, 22))
    arrow(ax, (63, 14), (74, 14))
    save(fig, "fig_2_1_rag.png")


# --- Şekil 2.2 Hybrid search --------------------------------------------------
def fig_2_2():
    fig, ax = setup(10, 4.4)
    box(ax, 38, 78, 24, 16, "Sorgu Metni", "blue", bold=True)
    box(ax, 6, 44, 30, 18, "BM25\n(Anahtar Kelime\nSkoru)", "orange", bold=True)
    box(ax, 64, 44, 30, 18, "Vektör Benzerliği\n(Anlamsal Skor)", "purple", bold=True)
    box(ax, 33, 12, 34, 18, "Ağırlıklı Birleşim\n(α = 0.5)", "green", bold=True)
    arrow(ax, (44, 78), (21, 62))
    arrow(ax, (56, 78), (79, 62))
    arrow(ax, (21, 44), (44, 30))
    arrow(ax, (79, 44), (56, 30))
    ax.text(50, 3, "skor = (1−α)·BM25 + α·vektör", ha="center", fontsize=10, style="italic")
    save(fig, "fig_2_2_hybrid.png")


# --- Şekil 3.1 Mikroservis mimarisi -------------------------------------------
def fig_3_1():
    fig, ax = setup(11, 7)
    box(ax, 38, 90, 24, 8, "Front-App (React)", "blue", fs=9, bold=True)
    box(ax, 36, 76, 28, 8, "Gateway (JWT, Rate Limit)", "yellow", fs=9, bold=True)
    # servisler
    box(ax, 2, 60, 19, 9, "auth-service", "green", fs=9)
    box(ax, 23, 60, 19, 9, "user-service", "green", fs=9)
    box(ax, 44, 60, 22, 9, "db-service", "orange", fs=9, bold=True)
    box(ax, 70, 60, 26, 9, "fast-service (AI)", "orange", fs=9, bold=True)
    # alt katman
    box(ax, 2, 42, 19, 8, "auth-postgres", "gray", fs=8)
    box(ax, 23, 42, 19, 8, "user-postgres", "gray", fs=8)
    box(ax, 44, 42, 22, 8, "device-postgres", "gray", fs=8)
    box(ax, 70, 42, 26, 8, "Weaviate (Vektör DB)", "purple", fs=8, bold=True)
    box(ax, 36, 24, 28, 9, "Node WebSocket Ajanı", "blue", fs=9, bold=True)
    box(ax, 36, 8, 28, 9, "Kullanıcı Veritabanı", "red", fs=9, bold=True)
    box(ax, 2, 76, 22, 8, "Redis", "gray", fs=8)
    arrow(ax, (50, 90), (50, 84))
    arrow(ax, (44, 76), (11, 69))
    arrow(ax, (47, 76), (32, 69))
    arrow(ax, (51, 76), (55, 69))
    arrow(ax, (56, 76), (83, 69))
    arrow(ax, (11, 60), (11, 50))
    arrow(ax, (32, 60), (32, 50))
    arrow(ax, (55, 60), (55, 50))
    arrow(ax, (83, 60), (83, 50), "indeksle", fs=7)
    # db-service -> ajan (postgres satırını solundan dolaş)
    arrow(ax, (46, 60), (44, 33), fs=7, rad=0.35)
    ax.text(33, 37, "WebSocket", ha="center", fontsize=7,
            bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.9))
    # fast-service -> ajan (sağdan dolaş, kesikli)
    arrow(ax, (72, 60), (58, 33), fs=7, rad=-0.3, ls="--")
    ax.text(75, 37, "SQL üret", ha="center", fontsize=7,
            bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.9))
    arrow(ax, (50, 24), (50, 17), "sorgu çalıştır", fs=7)
    save(fig, "fig_3_1_arch.png")


# --- Şekil 3.2 Gateway JWT header akışı ---------------------------------------
def fig_3_2():
    fig, ax = setup(11, 3)
    y, h = 36, 28
    box(ax, 2, y, 18, h, "Tarayıcı\n(HttpOnly\ncookie)", "blue", fs=9, bold=True)
    box(ax, 28, y, 22, h, "Gateway\nJWT doğrula", "yellow", fs=9, bold=True)
    box(ax, 58, y, 18, h, "X-User-Id\nX-User-Role\nX-User-Email", "green", fs=8)
    box(ax, 82, y, 16, h, "Downstream\nServis", "orange", fs=9, bold=True)
    arrow(ax, (20, y + h / 2), (28, y + h / 2), "cookie", fs=8)
    arrow(ax, (50, y + h / 2), (58, y + h / 2), "header\nenjekte", fs=8)
    arrow(ax, (76, y + h / 2), (82, y + h / 2))
    save(fig, "fig_3_2_auth.png")


# --- Şekil 3.3 Agent-Server WebSocket sequence --------------------------------
def fig_3_3():
    fig, ax = setup(10, 5.2)
    lanes = {"db": 20, "agent": 55, "udb": 85}
    for name, x in lanes.items():
        ax.plot([x, x], [10, 88], color="#999", lw=1, ls="--")
    ax.text(20, 92, "db-service", ha="center", fontweight="bold")
    ax.text(55, 92, "Ajan", ha="center", fontweight="bold")
    ax.text(85, 92, "Kullanıcı DB", ha="center", fontweight="bold")
    def msg(y, x1, x2, t, ls="-"):
        arrow(ax, (x1, y), (x2, y), None, ls=ls)
        ax.text((x1 + x2) / 2, y + 2.5, t, ha="center", fontsize=8.5)
    msg(80, 20, 55, "NEW_DATABASE (şifresiz bağlantı bilgisi)")
    msg(70, 55, 85, "bağlan + doğrula")
    msg(60, 55, 20, "DATABASE_VERIFIED", ls="-")
    msg(48, 20, 55, "EXECUTE_QUERY (introspection / SQL)")
    msg(38, 55, 85, "sorguyu çalıştır")
    msg(28, 55, 20, "QUERY_RESULT (satırlar)")
    save(fig, "fig_3_3_ws.png")


# --- Şekil 4.1 Build-time introspection + indeksleme --------------------------
def fig_4_1():
    fig, ax = setup(11, 6.2)
    box(ax, 2, 84, 30, 12, "DB Doğrulandı\n(DatabaseVerifiedEvent)", "blue", fs=9, bold=True)
    box(ax, 2, 64, 30, 12, "Introspection\n(tablolar, kolonlar,\ntip, PK/FK, satır sayısı)", "orange", fs=9, bold=True)
    box(ax, 2, 44, 30, 12, "TableEntity / ColumnEntity\n(device-postgres)", "gray", fs=9)
    box(ax, 38, 44, 28, 12, "importance =\nlog₁₀(satır+1)", "green", fs=9, bold=True)
    box(ax, 38, 64, 28, 12, "LLM tablo açıklaması\n(\"purpose\")", "purple", fs=9, bold=True)
    box(ax, 70, 54, 28, 14, "content (vektörlenir)\n+ schema_text (saklanır)", "yellow", fs=9, bold=True)
    box(ax, 70, 24, 28, 14, "Weaviate\nDbTable koleksiyonu\n(text2vec-openai)", "purple", fs=9, bold=True)
    arrow(ax, (17, 84), (17, 76))
    arrow(ax, (17, 64), (17, 56))
    arrow(ax, (32, 50), (38, 50), "satır sayısı", fs=7)
    arrow(ax, (32, 53), (38, 68), "şema metni", fs=7, rad=0.25)
    arrow(ax, (66, 69), (70, 64), fs=7)
    ax.text(67, 72, "ekle", fontsize=7)
    arrow(ax, (66, 50), (70, 58), fs=7)
    arrow(ax, (84, 54), (84, 38), "insert_many", fs=7)
    save(fig, "fig_4_1_index.png")


# --- Şekil 4.2 Inference-time sorgu akışı -------------------------------------
def fig_4_2():
    fig, ax = setup(11, 6.4)
    box(ax, 35, 88, 30, 9, "Kullanıcı Sorusu", "blue", fs=9, bold=True)
    box(ax, 35, 73, 30, 9, "Hybrid Search\n(database_id ile filtre)", "orange", fs=9, bold=True)
    box(ax, 72, 73, 26, 9, "Weaviate", "purple", fs=9)
    box(ax, 35, 58, 30, 9, "importance ile\nyeniden sırala → top-N", "green", fs=9, bold=True)
    box(ax, 35, 43, 30, 9, "db_scheme\n(seçili schema_text)", "yellow", fs=9, bold=True)
    box(ax, 35, 28, 30, 9, "Analyzer (3 vaka)", "orange", fs=9, bold=True)
    box(ax, 35, 11, 30, 11, "CASE 1 → SQL üret\n(SELECT-only)", "green", fs=9, bold=True)
    box(ax, 2, 28, 28, 9, "CASE 3: genel yanıt", "gray", fs=8)
    box(ax, 70, 28, 28, 9, "CASE 2: eksik veri\n+ öneri", "gray", fs=8)
    arrow(ax, (50, 88), (50, 82))
    arrow(ax, (65, 77), (72, 77))
    arrow(ax, (72, 75), (65, 75))
    arrow(ax, (50, 73), (50, 67))
    arrow(ax, (50, 58), (50, 52))
    arrow(ax, (50, 43), (50, 37))
    arrow(ax, (50, 28), (50, 22))
    arrow(ax, (35, 31), (30, 31), fs=7)
    arrow(ax, (65, 31), (70, 31), fs=7)
    save(fig, "fig_4_2_query.png")


# --- Şekil 4.3 content vs schema_text obje yapısı -----------------------------
def fig_4_3():
    fig, ax = setup(10, 4.6)
    box(ax, 30, 86, 40, 10, "DbTable objesi", "yellow", bold=True)
    box(ax, 4, 40, 44, 36,
        "content  (VEKTÖRLENİR)\n\npublic.orders\ncolumns: id, user_id, total, ...\nforeign: orders.user_id -> users.id\npurpose: müşteri siparişlerini tutar",
        "blue", fs=8.5)
    box(ax, 52, 40, 44, 36,
        "schema_text  (SAKLANIR)\n\npublic.orders(\n  id integer PK,\n  user_id integer FK->users.id,\n  total numeric, ...\n)",
        "green", fs=8.5)
    ax.text(26, 30, "→ arama / embedding için", ha="center", fontsize=8.5, style="italic")
    ax.text(74, 30, "→ sorgu anında LLM'e verilir", ha="center", fontsize=8.5, style="italic")
    arrow(ax, (42, 86), (26, 76))
    arrow(ax, (58, 86), (74, 76))
    save(fig, "fig_4_3_object.png")


# --- Şekil 4.4 Analyzer 3-vaka karar şeması -----------------------------------
def fig_4_4():
    fig, ax = setup(10, 5)
    box(ax, 33, 84, 34, 12, "Soru + seçili şema", "blue", bold=True)
    box(ax, 33, 58, 34, 14, "Soru şema ile\nyanıtlanabilir mi?", "yellow", bold=True)
    box(ax, 2, 26, 28, 16, "CASE 1\nSQL üretilebilir\n→ SELECT", "green", fs=9, bold=True)
    box(ax, 36, 26, 28, 16, "CASE 2\nVeri şemada yok\n→ açıklama + öneri", "orange", fs=9, bold=True)
    box(ax, 70, 26, 28, 16, "CASE 3\nAlakasız (genel bilgi)\n→ yanıt + not", "gray", fs=9, bold=True)
    arrow(ax, (50, 84), (50, 72))
    arrow(ax, (40, 58), (16, 42), "evet", fs=8)
    arrow(ax, (50, 58), (50, 42), "kısmi", fs=8)
    arrow(ax, (60, 58), (84, 42), "hayır", fs=8)
    save(fig, "fig_4_4_cases.png")


# --- Şekil 6.1 Örnek senaryo akışı --------------------------------------------
def fig_6_1():
    fig, ax = setup(11, 3.2)
    y, h, w, gap = 34, 30, 15, 2.5
    steps = [
        ("Kullanıcı:\n\"geçen ay en çok\nharcayan 5 müşteri\"", "blue"),
        ("Hybrid search\norders, customers,\norder_items seçer", "orange"),
        ("Analyzer:\nCASE 1", "yellow"),
        ("SQL üret\n(JOIN + GROUP BY\n+ LIMIT 5)", "green"),
        ("Ajan çalıştırır\n→ tablo + grafik", "purple"),
    ]
    x = 1.5
    centers = []
    for t, c in steps:
        cx, cy, _, _ = box(ax, x, y, w, h, t, c, fs=8)
        centers.append((x, x + w))
        x += w + gap
    for i in range(len(steps) - 1):
        arrow(ax, (centers[i][1], y + h / 2), (centers[i + 1][0], y + h / 2))
    save(fig, "fig_6_1_scenario.png")


if __name__ == "__main__":
    fig_1_1(); fig_2_1(); fig_2_2(); fig_3_1(); fig_3_2(); fig_3_3()
    fig_4_1(); fig_4_2(); fig_4_3(); fig_4_4(); fig_6_1()
    print("Tum sekiller uretildi ->", OUT)
