let formData = {
  formId: "FORM-001",
  formTitle: "Creative Request Intake Form",
  description: "Intake form for requesting creative assets. Standard SLAs apply per <a href='https://example.com'>Service Policy</a>.",
  sourceSystem: "Airtable",
  targetSystem: "Workfront Planning",
  sections: [
    {
      sectionId: "SEC-1",
      title: "Intake & Project Type",
      description: "Basic categorization fields.",
      displayLogic: { enabled: false, junction: "AND", conditions: [] },
      skipLogic: { enabled: false, junction: "AND", conditions: [] },
      fields: [
        {
          fieldId: "FLD-101",
          name: "ProjectType",
          title: "Project Type",
          description: "Select the classification of the request.",
          required: true,
          dataType: { sourceType: "singleSelect", targetType: "Dropdown (Single Choice)" },
          sourceMapping: { databaseId: "appIntake", databaseName: "Base", tableId: "tblReq", tableName: "Requests", fieldId: "fld253", fieldName: "Project Type" },
          destinationMapping: { databaseId: "wfWs", databaseName: "Workspace", tableId: "wfRec", tableName: "Campaign Item", fieldId: "wfPType", fieldName: "Project Type" }
        }
      ]
    },
    {
      sectionId: "SEC-2",
      title: "Campaign Details",
      description: "Targeted information for holiday and team efforts.",
      displayLogic: {
        enabled: true,
        junction: "AND",
        conditions: [
          { controllingFieldId: "FLD-101", controllingFieldName: "ProjectType", operator: "equals", value: "Holiday Sales Prep" },
          { controllingFieldId: "FLD-101", controllingFieldName: "ProjectType", operator: "contains", value: "Team" },
          { controllingFieldId: "FLD-101", controllingFieldName: "ProjectType", operator: "doesNotContain", value: "Top Secret" },
          { controllingFieldId: "FLD-101", controllingFieldName: "ProjectType", operator: "notEquals", value: "Executive Team" }
        ]
      },
      skipLogic: { enabled: false, junction: "AND", conditions: [] },
      fields: [
        {
          fieldId: "FLD-201",
          name: "BudgetCode",
          title: "Budget Code",
          description: "Internal cost center.",
          required: false,
          dataType: { sourceType: "singleLineText", targetType: "Single Line Text" },
          sourceMapping: { databaseId: "appIntake", databaseName: "Base", tableId: "tblReq", tableName: "Requests", fieldId: "fld888", fieldName: "Budget Code" },
          destinationMapping: { databaseId: "wfWs", databaseName: "Workspace", tableId: "wfRec", tableName: "Campaign Item", fieldId: "wfBCode", fieldName: "Budget Code" }
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

const operatorOptions = [
  { val: "equals", label: "exactly equal to" },
  { val: "notEquals", label: "does NOT equal" },
  { val: "contains", label: "contains" },
  { val: "doesNotContain", label: "does NOT contain" },
  { val: "isEmpty", label: "is empty" },
  { val: "isNotEmpty", label: "is NOT empty" }
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

function getUpstreamFields(currentSectionIdx) {
  const upstream = [];
  for (let i = 0; i < currentSectionIdx; i++) {
    formData.sections[i].fields.forEach(f => {
      upstream.push({
        fieldId: f.fieldId,
        fieldName: f.name,
        title: f.title
      });
    });
  }
  return upstream;
}

function renderEditor() {
  const container = document.getElementById('sectionsContainer');
  container.innerHTML = '';

  formData.sections.forEach((sec, sIdx) => {
    const upstreamFields = getUpstreamFields(sIdx);
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

      <!-- Logic Controls at Section Header -->
      <div class="row">
        <div>
          <button class="btn-secondary" style="width:100%;" onclick="toggleLogic(${sIdx}, 'displayLogic')">
            ${sec.displayLogic.enabled ? 'Disable Display Logic' : '+ Add Display Logic'}
          </button>
        </div>
        <div>
          <button class="btn-secondary" style="width:100%;" onclick="toggleLogic(${sIdx}, 'skipLogic')">
            ${sec.skipLogic.enabled ? 'Disable Skip Logic' : '+ Add Skip Logic'}
          </button>
        </div>
      </div>

      ${sec.displayLogic.enabled ? renderLogicEditor(sIdx, 'displayLogic', 'Display Logic', upstreamFields) : ''}
      ${sec.skipLogic.enabled ? renderLogicEditor(sIdx, 'skipLogic', 'Skip Logic', upstreamFields) : ''}

      <h4 style="margin-top:1rem;">Section Fields</h4>
      <div id="fieldsContainer-${sIdx}"></div>
      <button onclick="addField(${sIdx})" class="btn-secondary" style="width:100%; margin-top: 0.5rem;">+ Add Field to Section</button>
    `;
    container.appendChild(secEl);
    renderFields(sIdx);
  });
}

function renderLogicEditor(sIdx, logicType, label, upstreamFields) {
  const logic = formData.sections[sIdx][logicType];
  return `
    <div class="logic-block">
      <div class="logic-header">
        <span>${label} Rules (Evaluated if prior fields match)</span>
        <select style="width: auto; padding: 0.2rem;" onchange="formData.sections[${sIdx}]['${logicType}'].junction=this.value; renderDocument();">
          <option value="AND" ${logic.junction==='AND'?'selected':''}>Match ALL (AND)</option>
          <option value="OR" ${logic.junction==='OR'?'selected':''}>Match ANY (OR)</option>
        </select>
      </div>
      ${upstreamFields.length === 0 ? '<div style="font-size:0.8rem; color:red;">No upstream fields available from previous sections.</div>' : ''}
      ${logic.conditions.map((cond, cIdx) => `
        <div class="logic-rule-row">
          <select style="flex:2;" onchange="updateConditionField(${sIdx}, '${logicType}', ${cIdx}, this.value)">
            <option value="">-- Select Controlling Upstream Field --</option>
            ${upstreamFields.map(uf => `
              <option value="${uf.fieldId}" ${cond.controllingFieldId===uf.fieldId?'selected':''}>
                ${uf.title} (${uf.fieldName} - ${uf.fieldId})
              </option>
            `).join('')}
          </select>
          <select style="flex:1.5;" onchange="formData.sections[${sIdx}]['${logicType}'].conditions[${cIdx}].operator=this.value; renderDocument();">
            ${operatorOptions.map(op => `<option value="${op.val}" ${cond.operator===op.val?'selected':''}>${op.label}</option>`).join('')}
          </select>
          <input type="text" style="flex:1.5;" placeholder="Value" value="${cond.value||''}" oninput="formData.sections[${sIdx}]['${logicType}'].conditions[${cIdx}].value=this.value; renderDocument();">
          <button class="btn-danger" onclick="removeCondition(${sIdx}, '${logicType}', ${cIdx})">&times;</button>
        </div>
      `).join('')}
      <button class="btn-secondary" style="font-size:0.75rem; padding: 0.2rem 0.5rem;" onclick="addCondition(${sIdx}, '${logicType}')">+ Add Condition</button>
    </div>
  `;
}

function toggleLogic(sIdx, logicType) {
  formData.sections[sIdx][logicType].enabled = !formData.sections[sIdx][logicType].enabled;
  renderEditor();
  renderDocument();
}

function addCondition(sIdx, logicType) {
  formData.sections[sIdx][logicType].conditions.push({
    controllingFieldId: "",
    controllingFieldName: "",
    operator: "equals",
    value: ""
  });
  renderEditor();
  renderDocument();
}

function removeCondition(sIdx, logicType, cIdx) {
  formData.sections[sIdx][logicType].conditions.splice(cIdx, 1);
  renderEditor();
  renderDocument();
}

function updateConditionField(sIdx, logicType, cIdx, fieldId) {
  const upstreamFields = getUpstreamFields(sIdx);
  const match = upstreamFields.find(f => f.fieldId === fieldId);
  if (match) {
    formData.sections[sIdx][logicType].conditions[cIdx].controllingFieldId = match.fieldId;
    formData.sections[sIdx][logicType].conditions[cIdx].controllingFieldName = match.fieldName;
  } else {
    formData.sections[sIdx][logicType].conditions[cIdx].controllingFieldId = "";
    formData.sections[sIdx][logicType].conditions[cIdx].controllingFieldName = "";
  }
  renderDocument();
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
        <div><label>Field ID</label><input type="text" value="${f.fieldId}" oninput="formData.sections[${sIdx}].fields[${fIdx}].fieldId=this.value; renderEditor(); renderDocument();"></div>
        <div><label>System Name</label><input type="text" value="${f.name}" oninput="formData.sections[${sIdx}].fields[${fIdx}].name=this.value; renderEditor(); renderDocument();"></div>
        <div><label>Display Title</label><input type="text" value="${f.title}" oninput="formData.sections[${sIdx}].fields[${fIdx}].title=this.value; renderEditor(); renderDocument();"></div>
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
        <div><input type="text" placeholder="Database ID" value="${f.sourceMapping.databaseId}" oninput="formData.sections[${sIdx}].fields[${fIdx}].sourceMapping.databaseId=this.value; renderDocument();"></div>
        <div><input type="text" placeholder="Table Name" value="${f.sourceMapping.tableName}" oninput="formData.sections[${sIdx}].fields[${fIdx}].sourceMapping.tableName=this.value; renderDocument();"></div>
        <div><input type="text" placeholder="Field Name" value="${f.sourceMapping.fieldName}" oninput="formData.sections[${sIdx}].fields[${fIdx}].sourceMapping.fieldName=this.value; renderDocument();"></div>
      </div>
      <label><b>Destination Mapping (${formData.targetSystem})</b></label>
      <div class="row form-group">
        <div><input type="text" placeholder="Database ID" value="${f.destinationMapping.databaseId}" oninput="formData.sections[${sIdx}].fields[${fIdx}].destinationMapping.databaseId=this.value; renderDocument();"></div>
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
    displayLogic: { enabled: false, junction: "AND", conditions: [] },
    skipLogic: { enabled: false, junction: "AND", conditions: [] },
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

function formatLogicSummary(logicObj) {
  if (!logicObj || !logicObj.enabled || logicObj.conditions.length === 0) return '';
  return `
    <div class="logic-banner">
      <b>Logic Evaluated (${logicObj.junction} Match):</b>
      <ul>
        ${logicObj.conditions.map(c => {
          const opObj = operatorOptions.find(o => o.val === c.operator);
          const opLabel = opObj ? opObj.label : c.operator;
          return `<li>Controlling Field: <b>${c.controllingFieldName || 'Unset'}</b> [<code>${c.controllingFieldId || 'Unset'}</code>] &mdash; ${opLabel} <b>"${c.value || ''}"</b></li>`;
        }).join('')}
      </ul>
    </div>
  `;
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
          ${formatLogicSummary(sec.displayLogic)}
          ${formatLogicSummary(sec.skipLogic)}
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
            ${sec.fields.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:var(--text-subtle);">No fields in this section.</td></tr>' : ''}
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