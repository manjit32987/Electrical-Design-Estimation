# ⚡ Electrical Estimator (Web & Desktop App)

[![Live Web App](https://img.shields.io/badge/🌐_Live_Web_App-designestimation.netlify.app-00C7B7?style=for-the-badge&logo=netlify)](https://designestimation.netlify.app/)
[![License](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge)](LICENSE)

An electrical load planning, fixture calculation, wire estimation, and schematic floor plan generator available as both a **zero-install Web App** and a **PyQt6 Desktop App**.

> 🚀 **Try it Live in your browser instantly:** [https://designestimation.netlify.app/](https://designestimation.netlify.app/) *(No installation required!)*

---

## 🌐 Option 1: Web App (Zero-Install — Recommended)

No Python, PyQt6, or dependencies required! Works instantly in any modern web browser.

- 🔗 **Live URL**: [https://designestimation.netlify.app/](https://designestimation.netlify.app/)
- **Local Browser**: Simply open [`web/index.html`](file:///c:/Users/acer/Downloads/Electric%20Estimation/Electrical-Design-Estimation/web/index.html) in your browser.
- **Local Web Server**:
  ```bash
  python web/server.py
  ```

---

## 🖥️ Option 2: Desktop App (PyQt6)

### Prerequisites:
- Python 3.12 or 3.13
- pip

### Steps:

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/BuildingElectricalEstimator.git
cd BuildingElectricalEstimator

# 2. (Optional) Create a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS

# 3. Install dependencies
pip install PyQt6 matplotlib numpy

# 4. Run the desktop application
python main.py
```

> **Note:** `openpyxl` and `reportlab` are listed as future dependencies for Excel/PDF export. They are not required to run the current version.

---

##  How to Use

1. **Fill in Project Information** — project name, client name, building type.
2. **Add rooms** using the *+ Add Room* button. Edit name, dimensions, room type, and check AC if applicable.
3. **Adjust standards** if needed (defaults follow general IS/NBC guidelines).
4. Click ** Calculate** — results table and summary labels populate instantly.
5. Click **🗺 Generate Layout** — a schematic floor plan renders on the right panel.
6. Use **Export PNG / SVG** buttons below the canvas to save the drawing.
7. Click ** Save Project** to save your work as a `.json` file.

---

##  Calculation Logic

| Parameter | Formula |
|---|---|
| Area | `length × width` |
| Lights | `max(1, ceil(area / m²_per_light))` |
| Fans | `max(1, ceil(area / m²_per_fan))` |
| Sockets | `2` if lights ≤ 2 · `3` if lights ≤ 4 · `4` otherwise |
| AC Point | `1` if AC selected, else `0` |
| Connected Load | `(lights×12W) + (fans×75W) + (sockets×100W) + (ac×1500W)` |
| Wire Length | `total_perimeter × wastage_factor` |
| Cost | `(material subtotal) × (1 + conduit_factor + labour_factor)` |

---

##  Editing Unit Costs

Open `data/material_costs.json` and update values — no code changes needed:

```json
{
    "light_fitting":  350.0,
    "fan":           1500.0,
    "socket_outlet":  200.0,
    "ac_point":       800.0,
    "wire_per_metre":  25.0,
    "conduit_factor":   0.15,
    "labour_factor":    0.20
}
```

---

At last thanks for using this repo 

---


Pull requests are welcome.

---

