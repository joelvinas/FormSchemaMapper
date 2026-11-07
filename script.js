let formData = {
  formId: "FORM-001",
  formTitle: "Creative Request Intake Form",
  description: "Intake form for requesting creative assets. Standard SLAs apply per <a href='https://example.com'>Service Policy</a>.",
  sourceSystem: "Airtable",
  targetSystem: "Workfront Planning",
  sections: [
    {
      sectionId: "SEC-1",
      title: "General Information",
      description: "Basic metadata for the project intake process.",
      fields: [
        {
          fieldId: "FLD-101",
          name: "ProjectName",
          title: "Project Name",
          description: "Enter a <b>unique</b> descriptive title for the project.",
          required: true,
          dataType: { sourceType: "singleLineText", targetType: "Single Line Text" },
          sourceMapping: { databaseId: "app123", databaseName: "Marketing Base", tableId: "tbl456", tableName: "Requests", fieldId: "fld789", fieldName: "Project Name" },
          destinationMapping: { databaseId: "wfWorkspace", databaseName: "Marketing Workspace", tableId: "wfRec", tableName: "Campaign Work Item", fieldId: "wfName", fieldName: "Name" }
        }
      ]
    }
  ]
};

const sourceTypeOptions = [
  "singleLineText", "multilineText", "richText", "number", "percent",
  "currency", "singleSelect", "multipleSelects", "singleCollaborator",
  "multipleCollaborators", "date", "dateTime", "checkbox", "rating",
  "formula", "rollup", "count", "multipleRecordLinks", "lookup",
  "multipleAttachments", "url", "email", "phoneNumber", "autoNumber",
  "createdTime", "lastModifiedTime", "createdBy", "lastModifiedBy"
];

const targetTypeOptions = [
  "Single Line Text", "Paragraph Text", "Rich Text", "Integer",
  "Decimal", "Currency", "Percent", "Dropdown (Single Choice)",
  "Dropdown (Multi Choice)", "User / Personnel", "Date", "Date-Time",
  "Boolean / Checkbox", "Formula", "Rollup / Aggregation",
  "Linked Record / Relationship", "Lookup Value", "Attachment / File",
  "URL / Link", "Email", "Phone", "System Metadata"
];

function init() {
  document.getElementById('sourceSystem').value = formData.sourceSystem;
  document.getElementById('targetSystem').value = formData.targetSystem;
  renderEditor();
  renderDocument();
}

function updateData() {
  formData.formTitle = document.getElementById('formTitle').value;
  formData.sourceSystem = document.getElementById('sourceSystem').value || "Source System";
  formData.targetSystem = document.getElementById('targetSystem').value || "Target System";
  formData.description = document.getElementById('formDesc').value;
  renderDocument();
}

function renderEditor() {
  const container = document.getElementById('sectionsContainer');
  container.innerHTML = '';

  formData.sections.forEach((sec, sIdx) => {
    const secEl = document.createElement('div');
    secEl.className = 'card';
    secEl.innerHTML = `
      <div class="card-title">
        <span>Section ${sIdx + 1}</span>
        <button class="btn-danger" onclick="removeSection(${sIdx})">Remove Section</button>
      </div>
      <div class="form-group">
        <label>Section Title</label>
        <input type="text" value="${sec.title}" oninput="formData.sections[${sIdx}].title = this.value; renderDocument();">
      </div>
      <div class="form-group">
        <label>Section Description (HTML Supported)</label>
        <input type="text" value="${sec.description}" oninput="formData.sections[${sIdx}].description = this.value; renderDocument();">
      </div>
      <h4>Fields</h4>
      <div id="fieldsContainer-${sIdx}"></div>
      <button onclick="addField(${sIdx})" class="btn-secondary" style="width:100%; margin-top: 0.5rem;">+ Add Field to Section</button>
    `;
    container.appendChild(secEl);
    renderFields(sIdx);
  });
}

function renderFields(sIdx) {
  const container = document.getElementById(`fieldsContainer-${sIdx}`);
  container.innerHTML = '';

  formData.sections[sIdx].fields.forEach((f, fIdx) => {
    const fEl = document.createElement('div');
    fEl.className = 'card';
    fEl.style.background = '#f4f5f7';
    fEl.innerHTML = `
      <div class="card-title">
        <span>Field: ${f.title || 'New Field'}</span>
        <button class="btn-danger" onclick="removeField(${sIdx}, ${fIdx})">&times;</button>
      </div>
      <div class="row form-group">
        <div><label>Field ID</label><input type="text" value="${f.fieldId}" oninput="formData.sections[${sIdx}].fields[${fIdx}].fieldId=this.value; renderDocument();"></div>
        <div><label>System Name</label><input type="text" value="${f.name}" oninput="formData.sections[${sIdx}].fields[${fIdx}].name=this.value; renderDocument();"></div>
        <div><label>Display Title</label><input type="text" value="${f.title}" oninput="formData.sections[${sIdx}].fields[${fIdx}].title=this.value; renderDocument();"></div>
      </div>
      <div class="form-group">
        <label>Description (Supports HTML/Links/Bold)</label>
        <textarea rows="2" oninput="formData.sections[${sIdx}].fields[${fIdx}].description=this.value; renderDocument();">${f.description}</textarea>
      </div>
      <div class="row form-group">
        <div>
          <label>Source Field Type (${formData.sourceSystem})</label>
          <select onchange="formData.sections[${sIdx}].fields[${fIdx}].dataType.sourceType=this.value; renderDocument();">
            ${sourceTypeOptions.map(t => `<option value="${t}" ${f.dataType.sourceType===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Target Field Type (${formData.targetSystem})</label>
          <select onchange="formData.sections[${sIdx}].fields[${fIdx}].dataType.targetType=this.value; renderDocument();">
            ${targetTypeOptions.map(t => `<option value="${t}" ${f.dataType.targetType===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <label><b>Source Mapping (${formData.sourceSystem})</b></label>
      <div class="row form-group">
        <div><input type="text" placeholder="Database / Base ID" value="${f.sourceMapping.databaseId}" oninput="formData.sections[${sIdx}].fields[${fIdx}].sourceMapping.databaseId=this.value; renderDocument();"></div>
        <div><input type="text" placeholder="Table Name" value="${f.sourceMapping.tableName}" oninput="formData.sections[${sIdx}].fields[${fIdx}].sourceMapping.tableName=this.value; renderDocument();"></div>
        <div><input type="text" placeholder="Field Name" value="${f.sourceMapping.fieldName}" oninput="formData.sections[${sIdx}].fields[${fIdx}].sourceMapping.fieldName=this.value; renderDocument();"></div>
      </div>
      <label><b>Destination Mapping (${formData.targetSystem})</b></label>
      <div class="row form-group">
        <div><input type="text" placeholder="Database / Workspace ID" value="${f.destinationMapping.databaseId}" oninput="formData.sections[${sIdx}].fields[${fIdx}].destinationMapping.databaseId=this.value; renderDocument();"></div>
        <div><input type="text" placeholder="Table Name" value="${f.destinationMapping.tableName}" oninput="formData.sections[${sIdx}].fields[${fIdx}].destinationMapping.tableName=this.value; renderDocument();"></div>
        <div><input type="text" placeholder="Field Name" value="${f.destinationMapping.fieldName}" oninput="formData.sections[${sIdx}].fields[${fIdx}].destinationMapping.fieldName=this.value; renderDocument();"></div>
      </div>
    `;
    container.appendChild(fEl);
  });
}

function addSection() {
  formData.sections.push({
    sectionId: `SEC-${formData.sections.length + 1}`,
    title: "New Section",
    description: "",
    fields: []
  });
  renderEditor();
  renderDocument();
}

function removeSection(sIdx) {
  formData.sections.splice(sIdx, 1);
  renderEditor();
  renderDocument();
}

function addField(sIdx) {
  formData.sections[sIdx].fields.push({
    fieldId: `FLD-${Date.now().toString().slice(-4)}`,
    name: "NewField",
    title: "New Field",
    description: "",
    required: false,
    dataType: { sourceType: "singleLineText", targetType: "Single Line Text" },
    sourceMapping: { databaseId: "", databaseName: "", tableId: "", tableName: "", fieldId: "", fieldName: "" },
    destinationMapping: { databaseId: "", databaseName: "", tableId: "", tableName: "", fieldId: "", fieldName: "" }
  });
  renderEditor();
  renderDocument();
}

function removeField(sIdx, fIdx) {
  formData.sections[sIdx].fields.splice(fIdx, 1);
  renderEditor();
  renderDocument();
}

function renderDocument() {
  const doc = document.getElementById('documentRender');
  doc.innerHTML = `
    <div class="doc-header">
      <h2>${formData.formTitle}</h2>
      <p>${formData.description}</p>
      <div>
        <span class="badge">Source System: ${formData.sourceSystem}</span> &rarr;
        <span class="badge">Target System: ${formData.targetSystem}</span>
      </div>
    </div>
    ${formData.sections.map((sec, sIdx) => `
      <div class="doc-section">
        <div class="doc-section-header">
          <h3>Section ${sIdx + 1}: ${sec.title}</h3>
          ${sec.description ? `<p style="margin: 0.25rem 0 0 0; font-size: 0.85rem;">${sec.description}</p>` : ''}
        </div>
        <table class="doc-field-table">
          <thead>
            <tr>
              <th>Field Metadata</th>
              <th>Data Types</th>
              <th>Source Endpoint (${formData.sourceSystem})</th>
              <th>Destination Endpoint (${formData.targetSystem})</th>
            </tr>
          </thead>
          <tbody>
            ${sec.fields.map(f => `
              <tr>
                <td>
                  <b>${f.title}</b> ${f.required ? '<span style="color:red">*</span>' : ''}<br>
                  <small style="color: var(--text-subtle);">ID: ${f.fieldId} | System: ${f.name}</small>
                  ${f.description ? `<div style="margin-top:0.4rem;">${f.description}</div>` : ''}
                </td>
                <td>
                  <span class="badge">${formData.sourceSystem}</span> ${f.dataType.sourceType}<br>
                  <span class="badge" style="margin-top: 0.2rem;">${formData.targetSystem}</span> ${f.dataType.targetType}
                </td>
                <td>
                  <div class="endpoint-box">
                    <b>DB:</b> ${f.sourceMapping.databaseId || 'N/A'}<br>
                    <b>Table:</b> ${f.sourceMapping.tableName || 'N/A'}<br>
                    <b>Field:</b> ${f.sourceMapping.fieldName || 'N/A'} [${f.sourceMapping.fieldId || 'N/A'}]
                  </div>
                </td>
                <td>
                  <div class="endpoint-box">
                    <b>DB:</b> ${f.destinationMapping.databaseId || 'N/A'}<br>
                    <b>Table:</b> ${f.destinationMapping.tableName || 'N/A'}<br>
                    <b>Field:</b> ${f.destinationMapping.fieldName || 'N/A'} [${f.destinationMapping.fieldId || 'N/A'}]
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('')}
  `;
}

function exportJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${formData.formTitle.replace(/\s+/g, '_')}_Spec.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = readerEvent => {
      formData = JSON.parse(readerEvent.target.result);
      document.getElementById('formTitle').value = formData.formTitle;
      document.getElementById('sourceSystem').value = formData.sourceSystem || "";
      document.getElementById('targetSystem').value = formData.targetSystem || "";
      document.getElementById('formDesc').value = formData.description;
      renderEditor();
      renderDocument();
    };
  };
  input.click();
}

window.onload = init;