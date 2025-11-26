const sheetCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQs5iOdYRcQ_ekDgPPzIw7FRwN1tiF7hY3YWPAw3_6ga6xUMt-SgeiNzSMpVotjUypdAAZUAvRfReAu/pub?output=csv";

const API_URL = "https://script.google.com/macros/s/AKfycbwgVsAYrrtqbdYJyMjrr69FfPwhJN4R4z8Bwmk4IkUhN0P5NU0Eevto5zp1IiQg30f-/exec"; 



/* ======================= LOAD CSV ======================= */
async function loadInventory() {
    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "⏳ Đang tải dữ liệu...";
    
    try {
        let res = await fetch(sheetCSV);
        let csvText = await res.text();
        const data = parseCSV(csvText);

        window.inventoryData = data;

        renderGroupedTable(data);
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
        <input class="search-box" type="text" placeholder="🔎 Tìm mẫu hoặc barcode…" oninput="search(this.value)">
        <div class="table-container">
        <table>
            <tr>
                <th>Loại / Mẫu</th>
                <th>Mã vạch</th>
                <th>Tồn kho</th>
                <th>Hình</th>
            </tr>
    `;

    Object.keys(grouped).forEach((loai, index) => {
        let list = grouped[loai];
        let tong = list.reduce((sum, x) => sum + parseInt(x.TonKho || 0), 0);
        let id = "group_" + index;

        let anhDaiDien = list[0].Hinh ? `<img src="images/${list[0].Hinh}" class="thumbnail">` : "—";
        let barcodeDaiDien = list[0].Barcode || "";

        html += `
            <tr class="group-row" onclick="toggleGroup('${id}', this)">
                <td><span class="arrow">▸</span> <b>${loai}</b></td>
                <td>${barcodeDaiDien}</td>
                <td><b>${tong}</b></td>
                <td>${anhDaiDien}</td>
            </tr>
        `;

        list.forEach((item, i) => {
            let rowClass = getStockClass(item.TonKho);

            html += `
                <tr class="child-row ${rowClass}" data-group="${id}" style="display:none;">
                    <td style="padding-left:40px">${item.TenMau}</td>
                    <td>${item.Barcode}</td>
                    <td id="stock_${item.Barcode}_${i}">${item.TonKho}</td>
                    <td>
                        ${item.Hinh ? `<img src="images/${item.Hinh}" class="thumbnail">` : "—"}
                        
                        <div class="buy-area">
                            <input type="number" id="qty_${item.Barcode}_${i}" class="qty-input" value="1" min="1">
                            <button class="buy-btn"
                                onclick="buyItem('${item.Barcode}', '${i}', '${id}')">Mua</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    });

    html += "</table></div>";
    document.getElementById("table").innerHTML = html;
}



/* ======================= COLLAPSE ======================= */
function toggleGroup(id, headerRow) {
    const rows = document.querySelectorAll(`tr[data-group="${id}"]`);
    const arrow = headerRow.querySelector(".arrow");

    const isClosed = rows[0].style.display === "none";

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



/* ======================= BUY ITEM VIA GET API ======================= */
async function buyItem(barcode, index) {

    let qtyField = document.getElementById(`qty_${barcode}_${index}`);
    let qty = parseInt(qtyField.value) || 1;

    const url = `${API_URL}?action=minus&barcode=${barcode}&qty=${qty}`;

    try {
        const res = await fetch(url);    // <-- GET request, KHÔNG CORS
        const data = await res.json();

        if (!data.success) {
            alert("❌ Barcode không tồn tại trong Google Sheet!");
            return;
        }

        document.getElementById(`stock_${barcode}_${index}`).textContent = data.newStock;

        alert(`✔ Đã trừ tồn:\nBarcode: ${barcode}\nSố lượng: ${qty}\nTồn mới: ${data.newStock}`);

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
