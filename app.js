const sheetCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQs5iOdYRcQ_ekDgPPzIw7FRwN1tiF7hY3YWPAw3_6ga6xUMt-SgeiNzSMpVotjUypdAAZUAvRfReAu/pub?output=csv";

async function loadInventory() {
    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "⏳ Đang tải dữ liệu...";

    try {
        let res = await fetch(sheetCSV);
        let csvText = await res.text();
        const data = parseCSV(csvText);

        // Lưu toàn cục để tìm kiếm / sort
        window.inventoryData = data;

        renderTable(data);

    } catch (err) {
        tableDiv.innerHTML = "❌ Không tải được dữ liệu!";
        console.error(err);
    }
}

/* ---------------------------------------------------
   PARSE CSV CHUẨN (xử lý dấu phẩy, dấu ngoặc, BOM)
------------------------------------------------------ */
function parseCSV(str) {
    const rows = [];
    const lines = str.trim().split("\n");

    // Lấy header chính xác
    const rawHeaders = lines.shift();
    const headers = rawHeaders
        .match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        .map(h => h.replace(/"/g, "").trim());

    lines.forEach(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!values) return;

        let obj = {};
        headers.forEach((h, i) => {
            const val = (values[i] || "").replace(/"/g, "").trim();
            obj[h] = val;
        });
        rows.push(obj);
    });

    return rows;
}

/* ---------------------------------------------------
   RENDER TABLE
------------------------------------------------------ */
function renderTable(data) {
    if (!data || data.length === 0) {
        document.getElementById("table").innerHTML = "Không có dữ liệu";
        return;
    }

    let html = `
        <input class="search-box" type="text" placeholder="🔎 Tìm barcode hoặc tên..." oninput="search(this.value)">
        <div class="table-container">
        <table>
            <tr>
                <th>Hình</th>
                <th>Mã vạch</th>
                <th>Tên hàng</th>
                <th onclick="sortTonKho()" style="cursor:pointer">Tồn kho ⬍</th>
            </tr>
    `;

    data.forEach(row => {

        html += `
            <tr>
                <td>${row.Hinh ? `<img src="images/${row.Hinh}" class="thumbnail">` : "—"}</td>
                <td>${row.Barcode || ""}</td>
                <td>${row.Ten || ""}</td>
                <td class="${getStockClass(row.TonKho)}">${row.TonKho || 0}</td>
            </tr>
        `;
    });

    html += "</table></div>";
    document.getElementById("table").innerHTML = html;
}

/* ---------------------------------------------------
   BÁO TỒN KHO
------------------------------------------------------ */

function getStockClass(qty) {
    qty = parseInt(qty || 0);

    if (qty <= 3) return "low-stock";       // đỏ
    if (qty <= 10) return "medium-stock";   // cam
    return "normal-stock";                  // xanh / đen
}

/* ---------------------------------------------------
   SEARCH
------------------------------------------------------ */
function search(keyword) {
    keyword = keyword.toLowerCase().trim();

    const filtered = window.inventoryData.filter(item =>
        (item.Barcode || "").toLowerCase().includes(keyword) ||
        (item.Ten || "").toLowerCase().includes(keyword)
    );

    renderTable(filtered);
}

/* ---------------------------------------------------
   SORT TỒN KHO
------------------------------------------------------ */
let sortAsc = true;

function sortTonKho() {
    const sorted = [...window.inventoryData].sort((a, b) => {
        const A = parseInt(a.TonKho || 0);
        const B = parseInt(b.TonKho || 0);
        return sortAsc ? A - B : B - A;
    });

    sortAsc = !sortAsc;
    renderTable(sorted);
}

// Start
loadInventory();

