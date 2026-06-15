/**
 * TexBioMed Provider Portal — Products Web App
 *
 * Spreadsheet layout (Sheet1):
 *   A: Product ID
 *   B: Product
 *   C: Dose
 *   D: Form
 *   E: Price
 *   F: Delivery Method
 *   G: Category
 *
 * Setup:
 * 1. Upload or paste data from "Healthcare Provider Live Products & Prices (1).xlsx"
 * 2. Extensions → Apps Script → paste this file
 * 3. Project Settings → Script properties → add API_TOKEN (long random secret)
 * 4. Deploy → New deployment → Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the deployment URL into .env.local:
 *      GOOGLE_PRODUCTS_WEB_APP_URL=<web app url>
 *      GOOGLE_APPS_SCRIPT_TOKEN=<same API_TOKEN value>
 */

const PRODUCTS_SHEET_NAME = "Sheet1";

const PRODUCT_HEADERS = {
  PRODUCT_ID: "product id",
  PRODUCT: "product",
  DOSE: "dose",
  FORM: "form",
  PRICE: "price",
  DELIVERY_METHOD: "delivery method",
  CATEGORY: "category",
};

function normalizeHeader_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function readApiToken_() {
  return PropertiesService.getScriptProperties().getProperty("API_TOKEN");
}

function unauthorized_() {
  return ContentService.createTextOutput(
    JSON.stringify({ error: "Unauthorized" }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function getProductsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(PRODUCTS_SHEET_NAME);

  if (!sheet) {
    throw new Error(
      'Missing sheet named "' +
        PRODUCTS_SHEET_NAME +
        '". Rename your products tab to Sheet1 or update PRODUCTS_SHEET_NAME.',
    );
  }

  return sheet;
}

function rowToProductRecord_(row, headerIndex) {
  function valueFor(headerKey) {
    const index = headerIndex[headerKey];
    if (index === undefined) {
      return "";
    }
    return String(row[index] ?? "").trim();
  }

  const productId = valueFor(PRODUCT_HEADERS.PRODUCT_ID);
  const product = valueFor(PRODUCT_HEADERS.PRODUCT);
  const dose = valueFor(PRODUCT_HEADERS.DOSE);
  const form = valueFor(PRODUCT_HEADERS.FORM);
  const price = valueFor(PRODUCT_HEADERS.PRICE);
  const deliveryMethod = valueFor(PRODUCT_HEADERS.DELIVERY_METHOD);
  const category = valueFor(PRODUCT_HEADERS.CATEGORY) || "Uncategorized";

  if (!product || !productId || !price) {
    return null;
  }

  return {
    product_id: productId,
    product: product,
    dose: dose,
    form: form,
    price: price,
    delivery_method: deliveryMethod,
    category: category,
    active: "true",
    sort_order: productId,
  };
}

function loadProductRecords_() {
  const sheet = getProductsSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(normalizeHeader_);
  const headerIndex = {};

  headers.forEach(function (header, index) {
    headerIndex[header] = index;
  });

  const requiredHeaders = Object.values(PRODUCT_HEADERS);
  const missingHeaders = requiredHeaders.filter(function (header) {
    return headerIndex[header] === undefined;
  });

  if (missingHeaders.length > 0) {
    throw new Error(
      "Missing required columns on row 1: " + missingHeaders.join(", "),
    );
  }

  const products = [];

  for (var i = 1; i < values.length; i += 1) {
    const record = rowToProductRecord_(values[i], headerIndex);
    if (record) {
      products.push(record);
    }
  }

  return products;
}

function doGet(e) {
  try {
    const token = readApiToken_();
    const providedToken = String((e && e.parameter && e.parameter.token) || "");

    if (!token || providedToken !== token) {
      return unauthorized_();
    }

    const products = loadProductRecords_();

    return jsonResponse_({
      sheet: PRODUCTS_SHEET_NAME,
      count: products.length,
      products: products,
    });
  } catch (error) {
    return jsonResponse_({
      error: error && error.message ? error.message : String(error),
      products: [],
    });
  }
}

/**
 * Optional health check from the Apps Script editor:
 * Run → testProducts
 */
function testProducts() {
  const products = loadProductRecords_();
  Logger.log("Loaded %s products", products.length);
  Logger.log(JSON.stringify(products[0], null, 2));
}
