import { ITEMS, RECIPES, itemIcon, bestArmor } from "../game/items.js";
import { SFX } from "../game/sfx.js";

// Injected by vite (define) — commit sha + build time. Lets us verify which
// version a player's browser is actually running.
export const BUILD_ID = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";

function el(tag, className, parent, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  if (parent) parent.appendChild(node);
  return node;
}

export class UI {
  constructor() {
    const root = el("div", "ui-root", document.body);
    this.root = root;
    root.addEventListener("contextmenu", (e) => e.preventDefault());

    // Underwater tint. Prepended so it paints under the HUD; toggled while the
    // player's head is below the water surface (the fixed quarter camera stays
    // above water, so this is how "being submerged" is communicated).
    this.underwater = document.createElement("div");
    this.underwater.className = "underwater";
    root.prepend(this.underwater);

    // HUD ---------------------------------------------------------------------
    this.hud = el("div", "hud", root);
    this.hearts = el("div", "hearts", this.hud);
    this.objective = el("div", "objective", this.hud);
    this.clock = el("div", "clock", this.hud);
    this.buffTag = el("div", "buff-tag hidden", this.hud);
    this.baseChip = el("div", "base-chip", this.hud);
    this.raidBar = el("div", "raid-bar hidden", this.hud);
    this.raidBar.innerHTML = `<div class="raid-label">🔥 授職の灯（祭壇）</div><div class="bar"><div class="fill"></div></div>
      <div class="raid-label boss-label hidden"></div><div class="bar boss-bar hidden"><div class="fill boss-fill"></div></div>`;
    // ボス戦のバー（大岩ガニ、ヴァルガ戦の祭壇・翼・三つの頭）。
    this.bossBars = el("div", "boss-bars hidden", this.hud);
    // 第7章の備え（矢倉の矢・灯の守り）。
    this.supplyChip = el("div", "supply-chip hidden", this.hud);
    // 大型対空ボウガンに乗っている間の案内。
    this.aimHint = el("div", "aim-hint hidden", this.hud);
    this.hotbar = el("div", "hotbar", this.hud);
    this.hotbarSlots = [];
    for (let i = 0; i < 8; i += 1) {
      const slot = el("div", "slot", this.hotbar);
      slot.dataset.index = i;
      el("span", "key", slot, String(i + 1));
      el("img", "icon", slot);
      el("span", "count", slot);
      slot.addEventListener("click", () => this.hooks.selectHotbar?.(i));
      this.hotbarSlots.push(slot);
    }
    this.heldName = el("div", "held-name", this.hud);
    this.toasts = el("div", "toasts", root);
    this.blueprintPanel = el("div", "blueprint-panel hidden", root);

    // Dialogue ------------------------------------------------------------------
    this.dialogueBox = el("div", "dialogue hidden", root);
    this.dialogueName = el("div", "dlg-name", this.dialogueBox);
    this.dialogueText = el("div", "dlg-text", this.dialogueBox);
    this.dialogueNext = el("div", "dlg-next", this.dialogueBox, "▼");
    this.choiceBox = el("div", "choice hidden", root);
    this.dialogue = new Dialogue(this);

    // Menu (inventory + crafting) -------------------------------------------------
    this.menu = el("div", "overlay menu hidden", root);
    this.menu.innerHTML = `
      <div class="panel">
        <div class="panel-title">📦 もちもの と クラフト <span class="hint">E / Esc で閉じる</span></div>
        <div class="menu-columns">
          <div class="inv-side"><div class="section-label">もちもの（クリックで入れ替え）</div><div class="inv-grid"></div>
          <div class="equip-info"></div></div>
          <div class="craft-side"><div class="section-label craft-station"></div><div class="craft-list"></div></div>
        </div>
      </div>`;
    this.invGrid = this.menu.querySelector(".inv-grid");
    this.craftList = this.menu.querySelector(".craft-list");
    this.craftStation = this.menu.querySelector(".craft-station");
    this.equipInfo = this.menu.querySelector(".equip-info");
    this.menuOpen = false;
    this.swapFrom = null;

    this.storage = el("div", "overlay storage hidden", root);
    this.storageCtx = null;

    // Book revival cutscene --------------------------------------------------------
    this.bookOverlay = el("div", "overlay book hidden", root);

    // Title / fade / help ---------------------------------------------------------
    this.title = el("div", "overlay title hidden", root);
    this.help = el("div", "overlay help hidden", root);
    this.pause = el("div", "overlay pause hidden", root);
    this.fadeEl = el("div", "fade", root);

    this.hooks = {}; // set by main: selectHotbar, craft, swapSlots, saveGame, quitToTitle
    this.setBaseLevel(0);

    this.menu.addEventListener("click", (e) => e.stopPropagation());
  }

  get modalOpen() {
    return (
      Boolean(this.movies?.open) ||
      this.menuOpen ||
      this.storageOpen ||
      this.dialogue.open ||
      !this.title.classList.contains("hidden") ||
      !this.help.classList.contains("hidden") ||
      !this.pause.classList.contains("hidden") ||
      !this.bookOverlay.classList.contains("hidden") ||
      !this.choiceBox.classList.contains("hidden")
    );
  }

  // --- HUD ------------------------------------------------------------------------

  setHp(hp, max) {
    const hearts = Math.ceil(max / 4);
    let html = "";
    for (let i = 0; i < hearts; i += 1) {
      const v = Math.max(0, Math.min(4, hp - i * 4));
      const cls = v >= 4 ? "full" : v > 0 ? "partial" : "empty";
      // Use one text-presentation glyph for every state. Mixing the white-heart
      // text glyph with the black-heart emoji gives them different metrics on
      // Windows, which shifts the HUD whenever HP changes.
      html += `<span class="heart ${cls}" style="--hp-fill:${v * 25}%" data-glyph="&#10084;&#65038;">&#10084;&#65038;</span>`;
    }
    this.hearts.innerHTML = html;
    this.hearts.setAttribute("aria-label", `HP ${hp} / ${max}`);
    this.hearts.title = `HP ${hp} / ${max}`;
  }

  setObjective(text) {
    if (this.objective.textContent !== text) this.objective.textContent = text;
  }

  setClock(text) {
    if (this.clock.textContent !== text) this.clock.textContent = text;
  }

  setBaseLevel(level) {
    this.baseChip.textContent = level > 0 ? `🚩 拠点レベル ${level}` : "";
  }

  setHotbar(inventory) {
    for (let i = 0; i < 8; i += 1) {
      const slot = this.hotbarSlots[i];
      const s = inventory.slots[i];
      const img = slot.querySelector(".icon");
      const count = slot.querySelector(".count");
      slot.classList.toggle("selected", inventory.selected === i);
      if (s) {
        img.src = itemIcon(s.id);
        img.style.display = "";
        count.textContent = s.count > 1 ? s.count : "";
      } else {
        img.style.display = "none";
        count.textContent = "";
      }
    }
    const held = inventory.slots[inventory.selected];
    this.heldName.textContent = held ? ITEMS[held.id].name : "";
  }

  setRaid(active, hp, max, bossHp, bossMax, label = "🔥 授職の灯（祭壇）", bossName = "") {
    this.raidBar.classList.toggle("hidden", !active);
    if (!active) return;
    this.raidBar.querySelector(".raid-label").textContent = label;
    this.raidBar.querySelector(".fill").style.width = `${(hp / max) * 100}%`;
    const bossLabel = this.raidBar.querySelector(".boss-label");
    const bossBar = this.raidBar.querySelector(".boss-bar");
    const showBoss = bossHp != null;
    bossLabel.classList.toggle("hidden", !showBoss);
    bossLabel.textContent = bossName;
    bossBar.classList.toggle("hidden", !showBoss);
    if (showBoss) this.raidBar.querySelector(".boss-fill").style.width = `${(bossHp / bossMax) * 100}%`;
  }

  // ボス戦のバー。bars: [{ label, hp, max, kind? }]（null で非表示）。
  setBossBars(bars) {
    this.bossBars.classList.toggle("hidden", !bars);
    // ゲージが2本以上並ぶ間は、目的の表示を左へ収める（中央のゲージに重ねない）。
    this.objective.classList.toggle("beside-bars", !!bars && bars.length > 1);
    if (!bars) {
      this.bossBarsKey = null;
      return;
    }
    const key = bars.map((b) => b.label).join("|");
    if (this.bossBarsKey !== key) {
      this.bossBarsKey = key;
      this.bossBars.innerHTML = bars
        .map((b) => `<div class="raid-label">${b.label}</div><div class="bar"><div class="fill${b.kind === "altar" ? "" : " boss-fill"}"></div></div>`)
        .join("");
    }
    const fills = this.bossBars.querySelectorAll(".fill");
    bars.forEach((b, i) => {
      fills[i].style.width = `${Math.max(0, Math.min(100, (b.hp / b.max) * 100))}%`;
    });
  }

  // 第7章の備えの表示（null で非表示）。
  setSupply(supply) {
    this.supplyChip.classList.toggle("hidden", !supply);
    if (!supply) return;
    const text = `🏹 矢倉 ${supply.bolts}本　🔥 灯の守り ${Math.round(supply.altarHp)}/${supply.altarMax}`;
    if (this.supplyChip.textContent !== text) this.supplyChip.textContent = text;
  }

  // 大型対空ボウガンに乗っている間の照準と案内。
  setAim(active, hint = "") {
    document.body.classList.toggle("aiming", active);
    this.aimHint.classList.toggle("hidden", !active);
    if (active && this.aimHint.textContent !== hint) this.aimHint.textContent = hint;
  }

  // 満腹バフなどの状態表示（null で非表示）。
  setBuff(text) {
    this.buffTag.classList.toggle("hidden", !text);
    if (text) this.buffTag.textContent = text;
  }

  setUnderwater(active) {
    this.underwater.classList.toggle("active", active);
  }

  toast(text, duration = 3600) {
    const node = el("div", "toast", this.toasts, text);
    requestAnimationFrame(() => node.classList.add("show"));
    setTimeout(() => {
      node.classList.remove("show");
      setTimeout(() => node.remove(), 400);
    }, duration);
  }

  setBlueprint(name, materials, done, total, note = null) {
    if (!name) {
      this.blueprintPanel.classList.add("hidden");
      this.blueprintHtml = null;
      return;
    }
    this.blueprintPanel.classList.remove("hidden");
    let rows = "";
    if (materials) {
      for (const [itemId, count] of materials) {
        rows += `<div class="bp-row"><img src="${itemIcon(itemId)}"><span>${ITEMS[itemId].name}</span><b>あと${count}</b></div>`;
      }
    }
    if (!rows) rows = `<div class="bp-row">✨ 完成まぢか！</div>`;
    if (note) rows += `<div class="bp-note">${note}</div>`;
    const html = `<div class="bp-title">📐 設計図：${name}（${done}/${total}）</div>${rows}`;
    if (this.blueprintHtml !== html) {
      this.blueprintHtml = html;
      this.blueprintPanel.innerHTML = html;
    }
  }

  // --- menu -------------------------------------------------------------------------

  toggleMenu(ctx) {
    if (this.menuOpen) this.closeMenu();
    else this.openMenu(ctx);
  }

  openMenu(ctx) {
    this.menuOpen = true;
    this.menuCtx = ctx;
    this.menu.classList.remove("hidden");
    this.renderMenu();
  }

  closeMenu() {
    this.menuOpen = false;
    this.swapFrom = null;
    this.menu.classList.add("hidden");
  }

  renderMenu() {
    const { inventory, nearBench, nearKamado, nearKiln, nearForge, stageIdx, stageIndexOf } = this.menuCtx;
    this.invGrid.innerHTML = "";
    inventory.slots.forEach((s, i) => {
      const cell = el("div", `inv-cell${i < 8 ? " hotbar-cell" : ""}${this.swapFrom === i ? " swap" : ""}`, this.invGrid);
      if (s) {
        el("img", "", cell).src = itemIcon(s.id);
        if (s.count > 1) el("span", "count", cell, s.count);
        cell.title = ITEMS[s.id].name;
      }
      cell.addEventListener("click", () => {
        if (this.swapFrom == null) {
          if (s) {
            this.swapFrom = i;
            this.renderMenu();
          }
        } else {
          this.hooks.swapSlots?.(this.swapFrom, i);
          this.swapFrom = null;
          this.renderMenu();
        }
      });
    });

    this.craftStation.textContent = nearForge
      ? "🔥 鍛冶（炉の近く）"
      : nearKiln
        ? "🏭 炭焼き（窯の近く）"
        : nearKamado
          ? "🍳 料理（かまどの近く）"
          : nearBench
            ? "🛠️ クラフト（作業台）"
            : "🖐️ クラフト（手作業）※作業台や炉の近くでレシピが増える";
    this.craftList.innerHTML = "";
    const stationOk = { hand: true, bench: nearBench, kamado: nearKamado, kiln: nearKiln, forge: nearForge };
    for (const recipe of RECIPES) {
      if (stageIndexOf(recipe.unlock) > stageIdx) continue;
      if (!stationOk[recipe.station]) continue;
      const hasMaterials = inventory.canCraftMaterials(recipe);
      const can = inventory.canCraft(recipe);
      const row = el("div", `craft-row${can ? "" : " disabled"}`, this.craftList);
      const costHtml = Object.entries(recipe.cost)
        .map(([id, n]) => `<span class="cost${inventory.count(id) >= n ? "" : " lack"}">${ITEMS[id].name}×${n}</span>`)
        .join(" ");
      row.innerHTML = `<img src="${itemIcon(recipe.out)}"><div class="craft-info"><b>${ITEMS[recipe.out].name}${recipe.n > 1 ? `×${recipe.n}` : ""}</b><div class="costs">${costHtml}</div></div><button>${can ? "作る" : hasMaterials ? "もちもの満杯" : "材料不足"}</button>`;
      row.querySelector("button").addEventListener("click", () => {
        if (this.hooks.craft?.(recipe)) {
          SFX.craft();
          this.renderMenu();
        }
      });
    }

    const armor = bestArmor(inventory);
    this.equipInfo.innerHTML = armor
      ? `🛡️ ${armor.name}装備中（防御+${armor.def} / さいだいHP+${armor.hp}）`
      : `そうび：なし（胸あてを持つと防御アップ）`;
  }

  get storageOpen() {
    return !this.storage.classList.contains("hidden");
  }

  openStorage(ctx) {
    this.storageCtx = ctx;
    this.storage.classList.remove("hidden");
    this.renderStorage();
  }

  hideStorage() {
    this.storage.classList.add("hidden");
    this.storageCtx = null;
  }

  renderStorage() {
    if (!this.storageCtx) return;
    const { inventory, storage, title } = this.storageCtx;
    const renderGrid = (inv, kind) => inv.slots.map((s, i) => {
      const body = s
        ? `<img src="${itemIcon(s.id)}">${s.count > 1 ? `<span class="count">${s.count}</span>` : ""}`
        : "";
      const itemTitle = s ? ` title="${ITEMS[s.id].name}"` : "";
      return `<div class="inv-cell${kind === "player" && i < 8 ? " hotbar-cell" : ""}" data-kind="${kind}" data-index="${i}"${itemTitle}>${body}</div>`;
    }).join("");

    this.storage.innerHTML = `
      <div class="panel storage-panel">
        <div class="panel-title">📦 ${title} <span class="hint">Esc で閉じる / クリックで移動</span></div>
        <div class="storage-columns">
          <div class="storage-side"><div class="section-label">もちもの</div><div class="inv-grid">${renderGrid(inventory, "player")}</div></div>
          <div class="storage-side"><div class="section-label">収納箱</div><div class="inv-grid">${renderGrid(storage, "storage")}</div></div>
        </div>
      </div>`;
    this.storage.querySelectorAll(".inv-cell").forEach((cell) => {
      cell.addEventListener("click", () => {
        const index = Number(cell.dataset.index);
        if (cell.dataset.kind === "player") this.hooks.storeItem?.(index);
        else this.hooks.takeStoredItem?.(index);
        this.renderStorage();
      });
    });
  }
  // --- special overlays ----------------------------------------------------------------

  showBookRevival(bookName, cb) {
    this.bookOverlay.classList.remove("hidden");
    this.bookOverlay.innerHTML = `
      <div class="book-panel">
        <div class="book-title">📖 ${bookName}</div>
        <div class="book-page">白紙のページに 光の文字が もどっていく……</div>
        <div class="book-bar"><div class="book-fill"></div></div>
      </div>`;
    const fill = this.bookOverlay.querySelector(".book-fill");
    requestAnimationFrame(() => {
      fill.style.width = "100%";
    });
    setTimeout(() => {
      this.bookOverlay.classList.add("flash");
      setTimeout(() => {
        this.bookOverlay.classList.add("hidden");
        this.bookOverlay.classList.remove("flash");
        cb();
      }, 700);
    }, 2600);
  }

  showTitle({ hasSave, onNew, onContinue }) {
    this.title.classList.remove("hidden");
    this.title.innerHTML = `
      <div class="title-inner">
        <div class="title-sub">ドラゴンクエストビルダーズ・オマージュ</div>
        <div class="title-logo">職をつぐ者</div>
        <div class="title-sub2">〜ダーマ再興編〜</div>
        <div class="title-buttons">
          <button class="btn-new">はじめから</button>
          <button class="btn-continue" ${hasSave ? "" : "disabled"}>つづきから</button>
          <button class="btn-help">そうさ方法</button>
        </div>
        <div class="title-copy">すべてが失われた、始まりの場所へ。——職を授ける灯を、もう一度。</div>
        <div class="title-version">build ${BUILD_ID}</div>
      </div>`;
    this.title.querySelector(".btn-new").addEventListener("click", () => {
      this.title.classList.add("hidden");
      onNew();
    });
    this.title.querySelector(".btn-continue").addEventListener("click", () => {
      if (!hasSave) return;
      this.title.classList.add("hidden");
      onContinue();
    });
    this.title.querySelector(".btn-help").addEventListener("click", () => this.showHelp());
  }

  showHelp() {
    this.help.classList.remove("hidden");
    this.help.innerHTML = `
      <div class="panel help-panel">
        <div class="panel-title">そうさ方法 <span class="hint">クリックで閉じる</span></div>
        <div class="help-grid">
          <div><b>WASD / 矢印</b> 移動</div><div><b>Space</b> ジャンプ</div>
          <div><b>左クリック</b> 置く・攻撃／<b>左ボタン長押し</b> ハンマーで採掘</div><div><b>右クリック</b> 指した人・設備を操作<br><b>F</b> 正面の近い人・設備を操作</div>
          <div><b>1〜8 / ホイール</b> 持ち物選択</div><div><b>E</b> もちもの・クラフト</div>
          <div><b>Q / [ / ]</b> カメラ回転（8方向）</div><div><b>B</b> 職業の書</div>
          <div><b>M</b> サウンドON/OFF</div><div><b>Esc</b> ポーズ（セーブ）</div>
          <div><b>大型対空ボウガン</b> 調べて乗る／<b>A・D</b> 向き／<b>クリック</b> 発射／<b>F</b> 降りる</div><div><b>ボウガン</b> 調べると 矢を矢倉へ入れる</div>
        </div>
        <div class="help-tips">💡 設計図の光る枠をクリックして建てよう。資材置き場の箱へ入れた資材は、大工たちも使う。カニの正面は硬いぞ！</div>
      </div>`;
    this.help.addEventListener("click", () => this.help.classList.add("hidden"), { once: true });
  }

  showPause(onSave, onResume) {
    this.pause.classList.remove("hidden");
    this.pause.innerHTML = `
      <div class="panel pause-panel">
        <div class="panel-title">⏸ ポーズ</div>
        <button class="btn-save">セーブする</button>
        <button class="btn-help2">そうさ方法</button>
        <button class="btn-resume">ゲームにもどる</button>
      </div>`;
    this.pause.querySelector(".btn-save").addEventListener("click", () => {
      const ok = onSave();
      this.toast(ok ? "💾 セーブしました" : "⚠️ セーブに失敗しました");
    });
    this.pause.querySelector(".btn-help2").addEventListener("click", () => {
      this.hidePause();
      this.showHelp();
    });
    this.pause.querySelector(".btn-resume").addEventListener("click", () => {
      this.pause.classList.add("hidden");
      onResume?.();
    });
  }

  hidePause() {
    this.pause.classList.add("hidden");
  }

  showJobBook(books) {
    this.bookOverlay.classList.remove("hidden");
    let rows = "";
    for (const b of books) {
      rows += `
        <div class="jobbook-row${b.revived ? " revived" : ""}">
          <div class="book-title small">📖 ${b.name}</div>
          <div class="book-desc">${b.desc}</div>
          <div class="book-bar"><div class="book-fill" style="width:${b.progress * 100}%"></div></div>
        </div>`;
    }
    this.bookOverlay.innerHTML = `<div class="book-panel">
      <div class="book-title">職業の書 <span class="hint">B / クリックで閉じる</span></div>${rows}</div>`;
    this.bookOverlay.addEventListener("click", () => this.bookOverlay.classList.add("hidden"), { once: true });
  }

  hideJobBook() {
    this.bookOverlay.classList.add("hidden");
  }

  fade(toBlack, duration = 600) {
    return new Promise((resolve) => {
      this.fadeEl.style.transitionDuration = `${duration}ms`;
      this.fadeEl.style.opacity = toBlack ? "1" : "0";
      setTimeout(resolve, duration);
    });
  }
}

// --- dialogue ---------------------------------------------------------------------

class Dialogue {
  constructor(ui) {
    this.ui = ui;
    this.open = false;
    this.lines = [];
    this.index = 0;
    this.charT = 0;
    this.done = null;
    this.typing = false;
    this.fullText = "";
    this.shown = 0;

    const advance = () => this.advance();
    ui.dialogueBox.addEventListener("click", advance);
    window.addEventListener("keydown", (e) => {
      if (!this.open) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "enter" || k === "z") {
        e.preventDefault();
        advance();
      }
    });
  }

  play(lines, done) {
    this.lines = lines;
    this.index = 0;
    this.done = done;
    this.open = true;
    this.ui.dialogueBox.classList.remove("hidden");
    this.showLine();
  }

  showLine() {
    const line = this.lines[this.index];
    this.ui.dialogueName.textContent = line.speaker;
    this.ui.dialogueName.style.display = line.speaker ? "" : "none";
    this.fullText = line.text;
    this.shown = 0;
    this.typing = true;
    this.ui.dialogueNext.style.visibility = "hidden";
    SFX.talk();
    const tick = () => {
      if (!this.typing) return;
      this.shown = Math.min(this.fullText.length, this.shown + 2);
      this.ui.dialogueText.textContent = this.fullText.slice(0, this.shown);
      if (this.shown >= this.fullText.length) {
        this.typing = false;
        this.ui.dialogueNext.style.visibility = "visible";
      } else {
        setTimeout(tick, 28);
      }
    };
    tick();
  }

  advance() {
    if (!this.open) return;
    if (this.typing) {
      this.typing = false;
      this.ui.dialogueText.textContent = this.fullText;
      this.ui.dialogueNext.style.visibility = "visible";
      return;
    }
    this.index += 1;
    if (this.index >= this.lines.length) {
      this.open = false;
      this.ui.dialogueBox.classList.add("hidden");
      const cb = this.done;
      this.done = null;
      if (cb) cb();
    } else {
      this.showLine();
    }
  }

  choice(prompt, options, cb) {
    const box = this.ui.choiceBox;
    box.classList.remove("hidden");
    box.innerHTML = `<div class="choice-panel"><div class="choice-prompt">${prompt}</div></div>`;
    const panel = box.querySelector(".choice-panel");
    options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        box.classList.add("hidden");
        // 古いボタンを残さない（隠れたまま残ると、後の選択肢と紛れる）。
        box.innerHTML = "";
        cb(i);
      });
      panel.appendChild(btn);
    });
  }
}
