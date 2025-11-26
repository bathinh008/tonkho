async function loadInventory() {
    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "Đang tải dữ liệu...";

    try {
        let res = await fetch("get_inventory.php");
        let data = await res.json();

        if (data.status !== "success") {
            tableDiv.innerHTML = "❌ Lỗi tải dữ liệu";
            return;
        }

        window.inventoryData = data.data;  // lưu tạm để filter
        renderTable(data.data);

    } catch (err) {
        tableDiv.innerHTML = "❌ Không kết nối được server";
    }
}

function renderTable(data) {
    let html = `
        <input class="search-box" type="text" placeholder="Tìm mã vạch / tên..." oninput="search(this.value)">
        <div class="table-container">
        <table>
            <tr>
                <th>Hình</th>
                <th>Mã vạch</th>
                <th>Tên</th>
                <th>Tồn kho</th>
            </tr>
    `;

    data.forEach(item => {
        html += `
            <tr>
                <td>
                    ${item.Hinh ? `<img class="thumbnail" src="images/${item.Hinh}">` : '—'}
                </td>
                <td>${item.Barcode || ""}</td>
                <td>${item.Ten || ""}</td>
                <td>${item.TonKho || 0}</td>
            </tr>
        `;
    });

    html += "</table></div>";
    document.getElementById("table").innerHTML = html;
}

function search(text) {
    text = text.toLowerCase();

    const filtered = window.inventoryData.filter(item =>
        (item.Barcode || "").toLowerCase().includes(text) ||
        (item.Ten || "").toLowerCase().includes(text)
    );

    renderTable(filtered);
}

loadInventory();
