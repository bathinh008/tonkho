const sheetCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQs5iOdYRcQ_ekDgPPzIw7FRwN1tiF7hY3YWPAw3_6ga6xUMt-SgeiNzSMpVotjUypdAAZUAvRfReAu/pub?output=csv";

// THAY URL NÀY NẾU CẬU VỪA DEPLOY LẠI APPS SCRIPT
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

        if (isMobile()) {
            renderMobileView(data);
        } else {
            renderGroupedTable(data); // PC
        }
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


/* ======================= RENDER GROUP TABLE ======================= */
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
        let tong = list.reduce((sum, x) => sum + parseInt(x.TonKho || 0), 0);
        let groupId = "group_" + groupIndex;

        let anhDaiDien = list[0].Hinh ? `<img src="images/${list[0].Hinh}" class="thumbnail">` : "—";
        let barcodeDaiDien = list[0].Barcode || "";

        html += `
            <tr class="group-row" onclick="toggleGroup('${groupId}', this)">
                <td><span class="arrow">▸</span> <b>${loai}</b></td>
                <td>${barcodeDaiDien}</td>
                <td><b id="group_total_${groupId}">${tong}</b></td>
                <td>${anhDaiDien}</td>
            </tr>
        `;

        list.forEach((item, i) => {
            let rowClass = getStockClass(item.TonKho);
            // key DOM riêng cho dòng này
            let rowKey = `${groupIndex}_${i}`;

            html += `
                <tr class="child-row ${rowClass}" data-group="${groupId}" style="display:none;">
                    <td style="padding-left:40px">${item.TenMau}</td>
                    <td>${item.Barcode}</td>
                    <td id="stock_${rowKey}">${item.TonKho}</td>
                    <td>
                        ${item.Hinh ? `<img src="images/${item.Hinh}" class="thumbnail">` : "—"}
                        
                        <div class="buy-area">
                            <input type="number" id="qty_${rowKey}" class="qty-input" value="1" min="1">
                            <button class="buy-btn"
                                onclick="buyItem('${item.Barcode}', '${item.Hinh}', '${rowKey}', '${groupId}')">
                                Mua
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    });

    html += "</table></div>";
    document.getElementById("table").innerHTML = html;
}

/* ======================= MOBILE CARD VIEW ======================= */
function renderMobileView(data) {
    let html = `<div class="mobile-list">`;

    data.forEach((item, index) => {
        let rowKey = "m_" + index;

        html += `
        <div class="card">
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

/* Nút + / - mobile */
function changeQty(rowKey, delta) {
    let input = document.getElementById(`qty_${rowKey}`);
    let v = parseInt(input.value) + delta;
    input.value = v > 0 ? v : 1;
}


/* ======================= COLLAPSE ======================= */
function toggleGroup(id, headerRow) {
    const rows = document.querySelectorAll(`tr[data-group="${id}"]`);
    const arrow = headerRow.querySelector(".arrow");

    const isClosed = rows[0].style.display === "none" || rows[0].style.display === "";

    if (isClosed) {
        arrow.textContent = "▼";
        rows.forEach(r => r.style.display = "table-row");
    } else {
        arrow.textContent = "▸";
        rows.forEach(r => r.style.display = "none");
    }
}


/* ======================= STOCK COLOR ======================= */
function getStockClass(qty) {
    qty = parseInt(qty || 0);
    if (qty <= 3) return "row-low-stock";
    if (qty <= 10) return "row-medium-stock";
    return "row-normal-stock";
}


/* ========= CẬP NHẬT TỔNG TỒN MỖI LOẠI SAU KHI MUA ========= */
function updateGroupTotal(groupId) {
    const rows = document.querySelectorAll(`tr[data-group="${groupId}"]`);

    let total = 0;
    rows.forEach(r => {
        const stockCell = r.querySelector("td[id^='stock_']");
        if (!stockCell) return;
        const qty = parseInt(stockCell.textContent || "0");
        total += qty;
    });

    const totalCell = document.getElementById(`group_total_${groupId}`);
    if (totalCell) totalCell.textContent = total;
}


/* ===== BUY ITEM – GỬI BARCODE + HÌNH + HỎI XÁC NHẬN ===== */
async function buyItem(barcode, hinh, rowKey, groupId) {
    let qtyField = document.getElementById(`qty_${rowKey}`);
    let qty = parseInt(qtyField.value) || 1;
    if (qty <= 0) qty = 1;

    const ok = confirm(
        `Xác nhận mua ${qty} sản phẩm?\n` +
        `Barcode: ${barcode}\n` +
        `Hình: ${hinh}`
    );
    if (!ok) return;

    const url = `${API_URL}?action=minus&barcode=${encodeURIComponent(barcode)}&hinh=${encodeURIComponent(hinh)}&qty=${qty}`;

    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log("API raw:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            alert("❌ API trả về không phải JSON. Kiểm tra lại Apps Script.");
            console.error("JSON parse error:", err);
            return;
        }

        if (!data.success) {
            alert("❌ Lỗi API: " + (data.message || "Unknown error"));
            return;
        }

        // Cập nhật tồn của mẫu
        const stockCell = document.getElementById(`stock_${rowKey}`);
        stockCell.textContent = data.newStock;

        // Cập nhật tổng tồn của loại
        updateGroupTotal(groupId);

        alert(
            `✔ Đã trừ tồn kho!\n` +
            `Barcode: ${barcode}\n` +
            `Hình: ${hinh}\n` +
            `Số lượng mua: ${qty}\n` +
            `Tồn mới: ${data.newStock}`
        );

    } catch (err) {
        alert("❌ Không thể kết nối API!");
        console.error(err);
    }
}


/* ======================= SEARCH ======================= */
function search(keyword) {
    keyword = keyword.toLowerCase().trim();

    const filtered = window.inventoryData.filter(item =>
        (item.TenMau || "").toLowerCase().includes(keyword) ||
        (item.Barcode || "").toLowerCase().includes(keyword)
    );

    renderGroupedTable(filtered);
}


loadInventory();


