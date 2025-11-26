const sheetCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQs5iOdYRcQ_ekDgPPzIw7FRwN1tiF7hY3YWPAw3_6ga6xUMt-SgeiNzSMpVotjUypdAAZUAvRfReAu/pub?output=csv";

// URL API Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbzDkTWSouNZW14cAJLO30GH1ZRLHIrdVJzLApqrUzVyeZbVebim_fOF5Dqfc-JmQCCf/exec";

function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || window.innerWidth <= 768;
}

/* ======================= LOAD CSV ======================= */
async function loadInventory() {
    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "⏳ Đang tải dữ liệu...";

    try {
        let res = await fetch(sheetCSV);
        let csvText = await res.text();
        const data = parseCSV(csvText);

        window.inventoryData = data;

        if (isMobile()) renderMobileView(data);
        else renderGroupedTable(data);

    } catch (err) {
        tableDiv.innerHTML = "❌ Không tải được dữ liệu!";
        console.error(err);
    }
}

/* ======================= PARSE CSV ======================= */
function parseCSV(str) {
    const rows = [];
    const lines = str.trim().split("\n");

    const headers = lines
        .shift()
        .match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        .map(h => h.replace(/"/g, "").trim());

    lines.forEach(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!values) return;

        let obj = {};
        headers.forEach((h, i) => {
            obj[h] = (values[i] || "").replace(/"/g, "").trim();
        });

        rows.push(obj);
    });

    return rows;
}

/* ======================= PC VIEW ======================= */
function renderGroupedTable(data) {
    let grouped = {};

    data.forEach(item => {
        let loai = item.LoaiTu || "Không phân loại";
        if (!grouped[loai]) grouped[loai] = [];
        grouped[loai].push(item);
    });

    let html = `
        <div class="table-container">
        <table>
            <tr>
                <th>Loại / Mẫu</th>
                <th>Mã vạch</th>
                <th>Tồn kho</th>
                <th>Hình / Mua</th>
            </tr>
    `;

    Object.keys(grouped).forEach((loai, groupIndex) => {

        let list = grouped[loai];

        // 👉 Chỉ tính tổng hàng còn tồn
        let tong = list.reduce((s, x) => {
            let t = parseInt(x.TonKho || 0);
            return t > 0 ? s + t : s;
        }, 0);

        let groupId = "group_" + groupIndex;

        let anhDaiDien = list[0].Hinh ? `<img src="images/${list[0].Hinh}" class="thumbnail">` : "—";

        html += `
            <tr class="group-row" onclick="toggleGroup('${groupId}', this)">
                <td><span class="arrow">▸</span> <b>${loai}</b></td>
                <td>${list[0].Barcode}</td>
                <td><b id="group_total_${groupId}">${tong}</b></td>
                <td>${anhDaiDien}</td>
            </tr>
        `;

        list.forEach((item, i) => {

            // ⭐ ẨN SẢN PHẨM HẾT HÀNG
            if (parseInt(item.TonKho) <= 0) return;

            let rowKey = `${groupIndex}_${i}`;

            html += `
                <tr class="child-row ${getStockClass(item.TonKho)}" data-group="${groupId}" style="display:none;">
                    <td style="padding-left:40px">${item.TenMau}</td>
                    <td>${item.Barcode}</td>
                    <td id="stock_${rowKey}">${item.TonKho}</td>
                    <td>
                        <img src="images/${item.Hinh}" class="thumbnail">
                        <div class="buy-area">
                            <input id="qty_${rowKey}" type="number" class="qty-input" value="1" min="1">
                            <button class="buy-btn" onclick="buyItem('${item.Barcode}', '${item.Hinh}', '${rowKey}', '${groupId}')">Mua</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    });

    html += "</table></div>";
    document.getElementById("table").innerHTML = html;
}

/* ======================= MOBILE VIEW ======================= */
function renderMobileView(data) {
    let html = `<div class="mobile-list">`;

    data.forEach((item, index) => {

        // ⭐ ẨN SẢN PHẨM HẾT HÀNG
        if (parseInt(item.TonKho) <= 0) return;

        let rowKey = "m_" + index;

        html += `
        <div class="card" id="card_${rowKey}">
            <img src="images/${item.Hinh}" class="card-img">

            <div class="card-info">
                <div class="card-title">${item.TenMau}</div>
                <div class="card-barcode">Barcode: ${item.Barcode}</div>
                <div class="card-stock ${getStockClass(item.TonKho)}">Tồn: ${item.TonKho}</div>
            </div>

            <div class="card-buy">
                <div class="qty-control">
                    <button onclick="changeQty('${rowKey}', -1)">−</button>
                    <input id="qty_${rowKey}" type="number" value="1" min="1">
                    <button onclick="changeQty('${rowKey}', 1)">+</button>
                </div>

                <button class="buy-btn"
                    onclick="buyItem('${item.Barcode}', '${item.Hinh}', '${rowKey}', '${item.LoaiTu}')">
                    Mua
                </button>
            </div>
        </div>`;
    });

    html += "</div>";
    document.getElementById("table").innerHTML = html;
}

function changeQty(key, delta) {
    let i = document.getElementById(`qty_${key}`);
    let v = parseInt(i.value) + delta;
    i.value = v > 0 ? v : 1;
}

/* ======================= COLLAPSE SECTION ======================= */
function toggleGroup(id, header) {
    const rows = document.querySelectorAll(`tr[data-group="${id}"]`);
    const arrow = header.querySelector(".arrow");

    const isClosed = rows[0].style.display === "none";

    if (isClosed) {
        arrow.textContent = "▼";
        rows.forEach(r => r.style.display = "table-row");
    } else {
        arrow.textContent = "▸";
        rows.forEach(r => r.style.display = "none");
    }
}

/* ======================= COLOR CLASS ======================= */
function getStockClass(qty) {
    qty = parseInt(qty || 0);
    if (qty <= 3) return "row-low-stock";
    if (qty <= 10) return "row-medium-stock";
    return "row-normal-stock";
}

/* ======================= UPDATE TOTAL ======================= */
function updateGroupTotal(groupId) {
    const rows = document.querySelectorAll(`tr[data-group="${groupId}"]`);

    let total = 0;
    rows.forEach(r => {
        let c = r.querySelector("td[id^='stock_']");
        if (c) total += parseInt(c.textContent || 0);
    });

    let cell = document.getElementById(`group_total_${groupId}`);
    if (cell) cell.textContent = total;
}

/* ======================= BUY ITEM ======================= */
async function buyItem(barcode, hinh, rowKey, groupId) {

    let qtyField = document.getElementById(`qty_${rowKey}`);
    let qty = parseInt(qtyField.value) || 1;

    if (!confirm(`Xác nhận mua ${qty} sản phẩm?\nBarcode: ${barcode}`)) return;

    const url = `${API_URL}?action=minus&barcode=${encodeURIComponent(barcode)}&hinh=${encodeURIComponent(hinh)}&qty=${qty}`;

    try {
        const res = await fetch(url);
        const text = await res.text();
        let data = JSON.parse(text);

        if (!data.success) {
            alert("❌ " + (data.message || "Không tìm thấy sản phẩm"));
            return;
        }

        /* PC update cell */
        let stockCell = document.getElementById(`stock_${rowKey}`);
        if (stockCell) stockCell.textContent = data.newStock;

        /* MOBILE update card */
        if (isMobile()) {
            let div = document.querySelector(`#card_${rowKey} .card-stock`);
            if (div) div.textContent = "Tồn: " + data.newStock;
        }

        updateGroupTotal(groupId);

        alert(`✔ Đã trừ tồn!\nBarcode: ${barcode}\nTồn mới: ${data.newStock}`);

        // ⭐ Nếu hết hàng → load lại để ẩn sản phẩm
        if (data.newStock <= 0) {
            loadInventory();
            return;
        }

    } catch (err) {
        alert("❌ Lỗi kết nối API");
        console.error(err);
    }
}

/* ======================= SEARCH ======================= */
function search(keyword) {
    keyword = keyword.toLowerCase().trim();

    const filtered = window.inventoryData.filter(item =>
        item.TenMau.toLowerCase().includes(keyword) ||
        item.Barcode.toLowerCase().includes(keyword)
    );

    if (isMobile()) renderMobileView(filtered);
    else renderGroupedTable(filtered);
}

loadInventory();
