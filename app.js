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

/* ------- CSV PARSER ---------- */
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


/* ------- HIỂN THỊ BẢNG THEO LOẠI TỦ ---------- */
function renderGroupedTable(data) {
    let grouped = {};

    // Nhóm theo LoaiTu
    data.forEach(item => {
        let loai = item.LoaiTu || "Không phân loại";
        if (!grouped[loai]) grouped[loai] = [];

        grouped[loai].push(item);
    });

    let html = `
        <input class="search-box" type="text" placeholder="🔎 Tìm tên mẫu..." oninput="search(this.value)">
        <div class="table-container">
        <table>
            <tr>
                <th>Loại tủ / Mẫu</th>
                <th>Tồn kho</th>
                <th>Hình</th>
            </tr>
    `;

    Object.keys(grouped).forEach(loai => {
        let list = grouped[loai];
        let tong = list.reduce((sum, x) => sum + parseInt(x.TonKho || 0), 0);

        // dòng tổng loại
        html += `
            <tr class="group-row">
                <td><b>${loai}</b></td>
                <td><b>${tong}</b></td>
                <td>—</td>
            </tr>
        `;

        // các mẫu con
        list.forEach(item => {
            html += `
                <tr>
                    <td style="padding-left:30px">${item.TenMau}</td>
                    <td>${item.TonKho}</td>
                    <td>${item.Hinh ? `<img src="images/${item.Hinh}" class="thumbnail">` : "—"}</td>
                </tr>
            `;
        });
    });

    html += "</table></div>";
    document.getElementById("table").innerHTML = html;
}


/* ------- TÌM KIẾM THEO TÊN MẪU ---------- */
function search(keyword) {
    keyword = keyword.toLowerCase().trim();

    const filtered = window.inventoryData.filter(item =>
        (item.TenMau || "").toLowerCase().includes(keyword)
    );

    renderGroupedTable(filtered);
}

loadInventory();
