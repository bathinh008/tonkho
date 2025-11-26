const sheetCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQs5iOdYRcQ_ekDgPPzIw7FRwN1tiF7hY3YWPAw3_6ga6xUMt-SgeiNzSMpVotjUypdAAZUAvRfReAu/pub?output=csv";

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


/* ======================= MAIN TABLE (GROUP + COLLAPSE) ======================= */
function renderGroupedTable(data) {
    let grouped = {};

    // Nhóm theo LoaiTu
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

        // Lấy hình mẫu đầu tiên
        let anhDaiDien = list[0].Hinh ? `<img src="images/${list[0].Hinh}" class="thumbnail">` : "—";

        // Tạo ID cho collapse
        let id = "group_" + index;

        html += `
            <tr class="group-row" onclick="toggleGroup('${id}')">
                <td><b>${loai}</b></td>
                <td>—</td>
                <td><b>${tong}</b></td>
                <td>${anhDaiDien}</td>
            </tr>
        `;

        // Các mẫu con (ẩn ban đầu)
        list.forEach(item => {
            let rowClass = getStockClass(item.TonKho);

            html += `
                <tr class="child-row ${rowClass}" data-group="${id}" style="display:none;">
                    <td style="padding-left:30px">${item.TenMau}</td>
                    <td>${item.Barcode || ""}</td>
                    <td>${item.TonKho}</td>
                    <td>${item.Hinh ? `<img src="images/${item.Hinh}" class="thumbnail">` : "—"}</td>
                </tr>
            `;
        });
    });

    html += "</table></div>";
    document.getElementById("table").innerHTML = html;
}

/* ======================= COLLAPSE / EXPAND ======================= */
function toggleGroup(id) {
    const rows = document.querySelectorAll(`tr[data-group="${id}"]`);

    rows.forEach(r => {
        r.style.display = r.style.display === "none" ? "table-row" : "none";
    });
}

/* ======================= TỒN KHO COLOR ======================= */
function getStockClass(qty) {
    qty = parseInt(qty || 0);

    if (qty <= 3) return "row-low-stock";        // đỏ
    if (qty <= 10) return "row-medium-stock";    // cam
    return "row-normal-stock";                   // xanh nhạt
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
