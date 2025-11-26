async function loadInventory() {
    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "⏳ Đang tải dữ liệu từ server...";

    try {
        let response = await fetch("get_inventory.php");
        let json = await response.json();

        if (json.status !== "success") {
            tableDiv.innerHTML = "❌ Lỗi dữ liệu: " + json.message;
            return;
        }

        // Lưu dữ liệu để filter
        window.inventoryData = json.data;

        // Render bảng
        renderTable(json.data);

    } catch (e) {
        tableDiv.innerHTML = "❌ Không kết nối được PHP backend!";
        console.error(e);
    }
}


// Render bảng HTML
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
                <td>${row.Barcode || ""}</td>
                <td>${row.Ten || ""}</td>
                <td>${row.TonKho || 0}</td>
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

// Auto load
loadInventory();
