let myTable;
let riverRow = null;
let selectedId;

//max e min globali per fiume
let maxLength = 0;
let maxDischarge = 0;
let maxArea = 0;
let minTemp = Infinity;
let maxTemp = -Infinity;

let margin = 20;

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

  myTable = await loadTable("assets/rivers_world.csv", ",", "header");

  for (let i = 0; i < myTable.getRowCount(); i++) {
    maxLength = max(maxLength, myTable.getNum(i, "length"));
    maxDischarge = max(maxDischarge, myTable.getNum(i, "discharge"));
    maxArea = max(maxArea, myTable.getNum(i, "area"));
    minTemp = min(minTemp, myTable.getNum(i, "min_temp"));
    maxTemp = max(maxTemp, myTable.getNum(i, "max_temp"));
  }

//parametro pag
  let params = getURLParams();
  selectedId = params.river;
  riverRow = myTable.findRow(String(selectedId), "id");
}

function draw() {
  background(245);

  if (!riverRow) {
    noStroke();
    fill(0);
    textAlign(LEFT, TOP);
    textSize(18);
    text("Fiume non trovato. Torna alla panoramica e scegli un glifo.", margin, margin);
    return;
  }

//dati riga che seleziona fiume
  let river = {
    name: riverRow.get("name"),
    continent: riverRow.get("continent"),
    length: float(riverRow.get("length")),
    discharge: float(riverRow.get("discharge")),
    area: float(riverRow.get("area")),
    tributaries: float(riverRow.get("tributaries")),
    minT: float(riverRow.get("min_temp")),
    maxT: float(riverRow.get("max_temp")),
    avgT: float(riverRow.get("avg_temp")),
    outflow: riverRow.get("outflow"),
    countryList: riverRow.get("countries").split(",").map(s => s.trim()),
  };
  river.countries = river.countryList.length;
  let col = colorScale[river.continent] || '#888888';

  noStroke();
  fill(0);
  textAlign(LEFT, TOP);

//titolo e sub 
  textStyle(BOLD);
  textSize(26);
  text(river.name, margin, margin, width - 260);
  textStyle(NORMAL);
  let titleLines = ceil(textWidth(river.name) / (width - 260)); // stima (textSize è ancora 26)
  let subY = margin + 34 * max(1, titleLines);
  textSize(13);
  fill(90);
  text(river.continent + " · sfocia in: " + river.outflow, margin, subY);

//colonna sx
  let top = subY + 40;
  let R = constrain(min((height - top - 190) / 2, (width - 60) * 0.2), 70, 190);
  let cx = margin + R;
  let cy = top + R;

//raggio del fiume + lungo
  noFill();
  stroke(190);
  drawingContext.setLineDash([4, 4]);
  circle(cx, cy, R * 2 * 0.7);
  drawingContext.setLineDash([]);

  drawGlyph(river, cx, cy, R);

  drawLegend(margin, cy + R + 24, river, col);

//colonna dx
  let rx = margin + 2 * R + 70;
  let rw = width - rx - margin;
  if (rw < 260) {
    // schermo stretto: le altre misure vanno sotto la legenda
    rx = margin;
    rw = width - 2 * margin;
    drawMeasures(rx, cy + R + 190, rw, river, col);
  } else {
    drawMeasures(rx, top, rw, river, col);
  }
}


function drawGlyph(river, cx, cy, maxR) {
  let c0 = colorScale[river.continent] || '#888888';

//disco: raggio = lunghezza
  let R = map(river.length, 0, maxLength, maxR * 0.2, maxR * 0.7);
//nucleo: raggio = portata 
  let r = map(sqrt(river.discharge), 0, sqrt(maxDischarge), 2, R);

  noStroke();
  let c = color(c0);
  c.setAlpha(120);
  fill(c);
  circle(cx, cy, R * 2);

  fill(c0);
  circle(cx, cy, r * 2);

//raggio per ogni paese attraversato
  stroke(c0);
  strokeWeight(3);
  for (let k = 0; k < river.countries; k++) {
    let angle = (TWO_PI / river.countries) * k - HALF_PI;
    line(
      cx + cos(angle) * (R + 3), cy + sin(angle) * (R + 3),
      cx + cos(angle) * maxR * 0.95, cy + sin(angle) * maxR * 0.95
    );
  }
  strokeWeight(1);
}

//legenda e descrizione fiume
function drawLegend(x, y, river, col) {
  noStroke();
  fill(0);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(14);
  text("Come leggere il glifo", x, y);
  textStyle(NORMAL);
  textSize(12);
  y += 24;

  let c = color(col);
  c.setAlpha(120);

// disco
  fill(c); noStroke(); circle(x + 7, y + 7, 14);
  fill(0);
  text("DISCO = lunghezza: " + fmt(river.length) + " km (" + nf(100 * river.length / maxLength, 0, 0) +
       "% del più lungo). Cerchio tratteggiato = fiume più lungo (" + fmt(maxLength) + " km)", x + 22, y);
  y += 20;

// nucleo
  fill(col); noStroke(); circle(x + 7, y + 7, 8);
  fill(0);
  text("NUCLEO PIENO = portata: " + fmt(river.discharge) + " m³/s (scala a radice quadrata)", x + 22, y);
  y += 20;

// raggi
  stroke(col); strokeWeight(2); line(x + 1, y + 7, x + 13, y + 7); strokeWeight(1);
  noStroke(); fill(0);
  text("RAGGI = paesi attraversati: " + river.countries, x + 22, y);
  y += 20;

// colore
  fill(col); noStroke(); rect(x + 1, y + 1, 12, 12);
  fill(0);
  text("COLORE = continente: " + river.continent, x + 22, y);
}

//misure  
function drawMeasures(x, y, w, river, col) {
  noStroke();
  fill(0);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(14);
  text("Altre misure (scala comune a tutti i fiumi)", x, y);
  textStyle(NORMAL);
  textSize(12);
  y += 30;

//temperatura
  fill(0);
  text("TEMPERATURA: da " + river.minT + " °C a " + river.maxT + " °C · media " + river.avgT + " °C", x, y);
  y += 20;
  let barW = min(w, 520);
  let x0 = x;
  let xMin = map(river.minT, minTemp, maxTemp, x0, x0 + barW);
  let xMax = map(river.maxT, minTemp, maxTemp, x0, x0 + barW);
  let xAvg = map(river.avgT, minTemp, maxTemp, x0, x0 + barW);
  noStroke();
  fill(225);
  rect(x0, y, barW, 12);
  fill(col);
  rect(xMin, y, max(xMax - xMin, 3), 12);
  stroke(0); strokeWeight(2);
  line(xAvg, y - 3, xAvg, y + 15);
  strokeWeight(1);
  noStroke();
  fill(100);
  textSize(11);
  textAlign(LEFT, TOP);
  text(minTemp + " °C", x0, y + 18);
  textAlign(RIGHT, TOP);
  text(maxTemp + " °C", x0 + barW, y + 18);
  textAlign(LEFT, TOP);
  textSize(12);
  y += 50;

//bacino idrografico
  fill(0);
  text("BACINO IDROGRAFICO: " + fmt(river.area) + " km² (" + nf(100 * river.area / maxArea, 0, 1) +
       "% del più grande)", x, y);
  y += 20;
  noStroke();
  fill(225);
  rect(x0, y, barW, 12);
  fill(col);
  rect(x0, y, max(barW * river.area / maxArea, 2), 12);
  y += 36;

// affluenti
  fill(0);
  text("AFFLUENTI: " + fmt(river.tributaries) + "  (un pallino pieno = 5 affluenti, vuoto = resto)", x, y);
  y += 22;
  let full = floor(river.tributaries / 5);
  let rest = river.tributaries % 5;
  let total = full + (rest > 0 ? 1 : 0);
  let d = 12, pad = 5;
  let px = x0 + d / 2;
  let py = y + d / 2;
  for (let i = 0; i < total; i++) {
    stroke(col);
    if (i < full) fill(col); else noFill();
    circle(px, py, d);
    px += d + pad;
    if (px + d / 2 > x0 + w) {
      px = x0 + d / 2;
      py += d + pad;
    }
  }
  y = py + d + 22;

//paesi attraversati
  noStroke();
  fill(0);
  text("PAESI ATTRAVERSATI (" + river.countries + "):", x, y);
  y += 20;
  fill(70);
  text(river.countryList.join(" · "), x, y, w);
}

function fmt(v) {
  return Number(v).toLocaleString('it-IT');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
