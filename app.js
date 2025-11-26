const sheetCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQs5iOdYRcQ_ekDgPPzIw7FRwN1tiF7hY3YWPAw3_6ga6xUMt-SgeiNzSMpVotjUypdAAZUAvRfReAu/pub?gid=0&single=true&output=csv";

async function loadInventory() {
    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "⏳ Đang tải dữ liệu...";

    try {
        let res = await fetch(sheetCSV);
        let csvText = await res.text();
        const data = parseCSV(csvText);

        window.inventoryData = data;
        renderTable(data);

    } catch (err) {
        tableDiv.innerHTML = "❌ Không tải được dữ liệu!";
        console.error(err);
    }
}

// Parse CSV thành array of objects
function parseCSV(str) {
    const lines = str.trim().split("\n");
    const headers = lines.shift().split(",");
    return lines.map(line => {
        const values = line.split(",");
        let obj = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        return obj;
    });
}

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
                <th>Tồn kho</th>
            </tr>
    `;

    data.forEach(row => {
        html += `
            <tr>
                <td>${row.Hinh ? `<img src="images/${row.Hinh}" class="thumbnail">` : "—"}</td>
                <td>${row.Barcode}</td>
                <td>${row.Ten}</td>
                <td>${row.TonKho}</td>
            </tr>
        `;
    });

    html += "</table></div>";
    document.getElementById("table").innerHTML = html;
}

// Tìm kiếm
function search(keyword) {
    keyword = keyword.toLowerCase();
    const filtered = window.inventoryData.filter(item =>
        (item.Barcode || "").toLowerCase().includes(keyword) ||
        (item.Ten || "").toLowerCase().includes(keyword)
    );
    renderTable(filtered);
}

loadInventory();

