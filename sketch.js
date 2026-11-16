let myTable;
let rivers = [];       // un oggetto per ogni fiume
let maxLength = 0;     // lunghezza massima (serve per le scale)
let maxDischarge = 0;  // portata massima (serve per le scale)
let hoveredIndex = -1; // fiume sotto il mouse (-1 = nessuno)

//layout
let margin = 20;
let panelW = 300;      // larghezza del pannello a sinistra
let cols = 10;         // glifi per riga

//colore uguale continente
let colorScale = {
  'Africa': '#EDA966',
  'Asia': '#ED66ED',
  'Europe': '#66A9ED',
  'North America': '#4CC94C',
  'South America': '#E04B4B',
  'Oceania': '#E6C619',
  'Australia': '#26B8B0',
};

async function setup() {
  createCanvas(windowWidth, windowHeight);

//csv rivers_world.csv
  myTable = await loadTable("assets/rivers_world.csv", ",", "header");

  for (let i = 0; i < myTable.getRowCount(); i++) {
    let river = {
      id: myTable.getString(i, "id"),
      name: myTable.getString(i, "name"),
      continent: myTable.getString(i, "continent"),
      length: myTable.getNum(i, "length"),
      discharge: myTable.getNum(i, "discharge"),
      // "Russia, Mongolia" -> 2 paesi
      countries: myTable.getString(i, "countries").split(",").length,
    };
    rivers.push(river);

    if (river.length > maxLength) maxLength = river.length;
    if (river.discharge > maxDischarge) maxDischarge = river.discharge;
  }
}

function draw() {
  background(245);

  let rows = ceil(rivers.length / cols);
  let cell = min((width - panelW - 2 * margin) / cols, (height - 2 * margin) / rows);
  let gridX = panelW + margin;
  let gridY = margin;

  hoveredIndex = -1;

  for (let i = 0; i < rivers.length; i++) {
    // Centro della cella del glifo i
    let cx = gridX + (i % cols) * cell + cell / 2;
    let cy = gridY + floor(i / cols) * cell + cell / 2;

    // Rollover: il mouse è vicino al centro del glifo?
    if (dist(mouseX, mouseY, cx, cy) < cell / 2) {
      hoveredIndex = i;
    }

    // Sfondo chiaro dietro il glifo in rollover
    if (i == hoveredIndex) {
      noStroke();
      fill(225);
      circle(cx, cy, cell);
    }

    drawGlyph(rivers[i], cx, cy, cell / 2);
  }

  drawPanel();

//fiume sotto mouse
  if (hoveredIndex != -1) {
    cursor(HAND);
    noStroke();
    fill(0);
    textAlign(LEFT, TOP);
    textSize(12);
    text(rivers[hoveredIndex].name, mouseX + 10, mouseY + 10);
  } else {
    cursor(ARROW);
  }
}

// glifo è fiume
function drawGlyph(river, cx, cy, maxR) {
  // Disco: raggio = lunghezza
  let R = map(river.length, 0, maxLength, maxR * 0.2, maxR * 0.7);
  // Nucleo: raggio = portata (radice quadrata per ridurre le differenze)
  let r = map(sqrt(river.discharge), 0, sqrt(maxDischarge), 2, R);

  noStroke();

//disco
  let c = color(colorScale[river.continent]);
  c.setAlpha(120);
  fill(c);
  circle(cx, cy, R * 2);

  //nucleo
  fill(colorScale[river.continent]);
  circle(cx, cy, r * 2);

//raggio x paese che attraversa
  stroke(colorScale[river.continent]);
  strokeWeight(2);
  for (let k = 0; k < river.countries; k++) {
    let angle = (TWO_PI / river.countries) * k - HALF_PI;
    line(
      cx + cos(angle) * (R + 2), cy + sin(angle) * (R + 2),
      cx + cos(angle) * maxR * 0.95, cy + sin(angle) * maxR * 0.95
    );
  }
  strokeWeight(1);
}

//titolo legenda spiegaz.
function drawPanel() {
  let x = margin;
  let y = margin;

  noStroke();
  fill(0);
  textAlign(LEFT, TOP);

  textSize(24);
  text("I fiumi del mondo", x, y);
  y += 34;

  textSize(12);
  text("Un glifo per ognuno dei " + rivers.length + " fiumi", x, y);
  y += 36;

//legenda colori
  text("COLORE = continente", x, y);
  y += 20;
  let names = Object.keys(colorScale);
  for (let i = 0; i < names.length; i++) {
    fill(colorScale[names[i]]);
    circle(x + 6, y + 7, 12);
    fill(0);
    text(names[i], x + 20, y);
    y += 18;
  }
  y += 14;

//legenda frome
  text("DISCO = lunghezza del fiume", x, y);
  y += 20;
  text("NUCLEO PIENO = portata", x, y);
  y += 20;
  text("RAGGI = numero di paesi attraversati", x, y);
  y += 30;

  fill(100);
  text("Passa il mouse: nome e dati del fiume", x, y);
  y += 18;
  text("Clicca un glifo: pagina di dettaglio", x, y);
  y += 36;

//descrizione fiume con mouse 
  if (hoveredIndex != -1) {
    let r = rivers[hoveredIndex];
    fill(0);
    textSize(14);
    text(r.name, x, y, panelW - 2 * margin);
    textSize(12);
    y += 22 + 17 * (ceil(textWidth(r.name) / (panelW - 2 * margin)) - 1);
    text("Continente: " + r.continent, x, y);
    y += 18;
    text("Lunghezza: " + r.length + " km", x, y);
    y += 18;
    text("Portata: " + r.discharge + " m³/s", x, y);
    y += 18;
    text("Paesi attraversati: " + r.countries, x, y);
  }
}

//mousepressed
function mousePressed() {
  if (hoveredIndex != -1) {
    window.location.href = "detail.html?river=" + encodeURIComponent(rivers[hoveredIndex].id);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}