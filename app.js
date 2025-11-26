const sheetCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQs5iOdYRcQ_ekDgPPzIw7FRwN1tiF7hY3YWPAw3_6ga6xUMt-SgeiNzSMpVotjUypdAAZUAvRfReAu/pub?output=csv";

async function loadInventory() {
    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "⏳ Đang tải dữ liệu...";

    try {
        let res = await fetch(sheetCSV);
        let csvText = await res.text();
        const data = parseCSV(csvText);

        // Lưu data toàn cục
        window.inventoryData = data;

        renderTable(data);

    } catch (err) {
        tableDiv.innerHTML = "❌ Không tải được dữ liệu!";
        console.error(err);
    }
}

/* -------------------------
   CSV PARSER CHUẨN
--------------------------*/
function parseCSV(str) {
    const rows = [];
    const lines = str.trim().split("\n");

    // Tách header theo CSV chuẩn (xử lý trường có dấu phẩy bằng "")
    const headers = lines.shift().match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

    lines.forEach(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!values) return;

        let obj = {};
        headers.forEach((h, i) => {
            obj[h.replace(/"/g, "")] = (values[i] || "").replace(/"/g, "");
        });
        rows.push(obj);
    });

    return rows;
}

/* -------------------------
   RENDER TABLE
--------------------------*/
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
        const imgFile = row.Hinh ? row.Hinh.trim() : "";

        html += `
            <tr>
                <td>${imgFile ? `<img src="images/${imgFile}" class="thumbnail">` : "—"}</td>
                <td>${row.Barcode || ""}</td>
                <td>${row.Ten || ""}</td>
                <td>${row.TonKho || 0}</td>
            </tr>
        `;
    });

    html += "</table></div>";
    document.getElementById("table").innerHTML = html;
}

/* -------------------------
    SEARCH
--------------------------*/
function search(keyword) {
    keyword = keyword.toLowerCase().trim();

    const filtered = window.inventoryData.filter(item =>
        (item.Barcode || "").toLowerCase().includes(keyword) ||
        (item.Ten || "").toLowerCase().includes(keyword)
    );

    renderTable(filtered);
}

/* -------------------------
    SORT TỒN KHO (tăng/giảm)
--------------------------*/
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

loadInventory();
