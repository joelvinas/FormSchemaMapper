/* ------------------------------------------------------------------
   Form Migration Portal
   Sections are recursive: every section may contain `subsections`,
   which are full sections themselves (fields, display logic, skip
   logic, and further subsections). Sections are addressed by a path
   string of indices, e.g. "2" = third top-level section,
   "2.0" = its first subsection, "2.0.1" = that one's second subsection.
------------------------------------------------------------------- */

function emptyLogic() {
  return { enabled: false, junction: "AND", conditions: [] };
}

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
      displayLogic: emptyLogic(),
      skipLogic: emptyLogic(),
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
      ],
      subsections: []
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
      skipLogic: emptyLogic(),
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
      ],
      subsections: []
    },
    {
      sectionId: "SEC-3",
      title: "Section 3 (Example: Parent with Subsections)",
      description: "Shown based on a field in Section 2. Contains subsections 3.1 - 3.3.",
      displayLogic: {
        enabled: true,
        junction: "AND",
        conditions: [
          { controllingFieldId: "FLD-201", controllingFieldName: "BudgetCode", operator: "isNotEmpty", value: "" }
        ]
      },
      skipLogic: emptyLogic(),
      fields: [],
      subsections: [
        {
          sectionId: "SEC-3-1",
          title: "Subsection 3.1",
          description: "",
          displayLogic: {
            enabled: true,
            junction: "AND",
            conditions: [
              { controllingFieldId: "FLD-201", controllingFieldName: "BudgetCode", operator: "contains", value: "MKT" }
            ]
          },
          skipLogic: emptyLogic(),
          fields: [],
          subsections: []
        },
        {
          sectionId: "SEC-3-2",
          title: "Subsection 3.2",
          description: "",
          displayLogic: {
            enabled: true,
            junction: "AND",
            conditions: [
              { controllingFieldId: "FLD-101", controllingFieldName: "ProjectType", operator: "equals", value: "Holiday Sales Prep" }
            ]
          },
          skipLogic: emptyLogic(),
          fields: [],
          subsections: []
        },
        {
          sectionId: "SEC-3-3",
          title: "Subsection 3.3",
          description: "",
          displayLogic: {
            enabled: true,
            junction: "OR",
            conditions: [
              { controllingFieldId: "FLD-201", controllingFieldName: "BudgetCode", operator: "isEmpty", value: "" },
              { controllingFieldId: "FLD-101", controllingFieldName: "ProjectType", operator: "contains", value: "Team" }
            ]
          },
          skipLogic: emptyLogic(),
          fields: [],
          subsections: []
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

/* ---------- helpers ---------- */

// Escape text for use inside HTML attribute values (value="...").
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Make sure every section (at any depth) has all expected properties.
// Lets older exported JSON (without `subsections`) import cleanly.
function normalizeSections(sections) {
  (sections || []).forEach(sec => {
    sec.description = sec.description || "";
    sec.displayLogic = sec.displayLogic || emptyLogic();
    sec.skipLogic = sec.skipLogic || emptyLogic();
    sec.displayLogic.conditions = sec.displayLogic.conditions || [];
    sec.skipLogic.conditions = sec.skipLogic.conditions || [];
    sec.fields = sec.fields || [];
    sec.subsections = sec.subsections || [];
    normalizeSections(sec.subsections);
  });
}

// "2.0.1" -> number label "3.1.2"
function pathLabel(path) {
  return path.split('.').map(n => Number(n) + 1).join('.');
}

function parsePath(path) {
  return String(path).split('.').map(Number);
}

// Returns the array that contains the section at `path`, plus its index.
function getContainer(path) {
  const idxs = parsePath(path);
  const last = idxs.pop();
  let arr = formData.sections;
  idxs.forEach(i => { arr = arr[i].subsections; });
  return { arr, index: last };
}

function getSec(path) {
  const { arr, index } = getContainer(path);
  return arr[index];
}

function allSectionIds() {
  const ids = new Set();
  (function walk(list) {
    list.forEach(s => { ids.add(s.sectionId); walk(s.subsections || []); });
  })(formData.sections);
  return ids;
}

function newSectionId() {
  const ids = allSectionIds();
  let n = ids.size + 1;
  while (ids.has(`SEC-${n}`)) n++;
  return `SEC-${n}`;
}

function newSection(title) {
  return {
    sectionId: newSectionId(),
    title: title,
    description: "",
    displayLogic: emptyLogic(),
    skipLogic: emptyLogic(),
    fields: [],
    subsections: []
  };
}

/*
  Upstream fields = every field that appears BEFORE the target section in
  document order (depth-first). That includes:
   - all fields of earlier top-level sections and their subsections
   - the parent section's own fields (for a subsection)
   - fields in earlier sibling subsections
  The target section's own fields are excluded.
*/
function getUpstreamFields(targetPath) {
  const target = getSec(targetPath);
  const upstream = [];
  let found = false;

  function walk(list) {
    for (const sec of list) {
      if (found) return;
      if (sec === target) { found = true; return; }
      sec.fields.forEach(f => upstream.push({ fieldId: f.fieldId, fieldName: f.name, title: f.title }));
      walk(sec.subsections || []);
    }
  }
  walk(formData.sections);
  return upstream;
}

/* ---------- init / top-level data ---------- */

function init() {
  normalizeSections(formData.sections);
  document.getElementById('formTitle').value = formData.formTitle;
  document.getElementById('formDesc').value = formData.description;
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

/* ---------- editor rendering ---------- */

function renderEditor() {
  const container = document.getElementById('sectionsContainer');
  container.innerHTML = formData.sections
    .map((sec, i) => renderSectionEditor(sec, String(i), 0))
    .join('');
}

function renderSectionEditor(sec, path, depth) {
  const upstreamFields = getUpstreamFields(path);
  const label = pathLabel(path);
  const { arr } = getContainer(path);
  const canRemove = depth > 0 || formData.sections.length > 1;
  const kind = depth === 0 ? 'Section' : 'Subsection';
  const subCount = sec.subsections.length;

  return `
    <div class="card ${depth > 0 ? 'subsection-card' : ''}" style="${depth > 0 ? 'margin-left:' + Math.min(depth, 4) * 0.25 + 'rem;' : ''}">
      <div class="card-title">
        <span>${kind} ${label}${subCount ? ` <small style="color:var(--text-subtle);font-weight:normal;">(${subCount} subsection${subCount > 1 ? 's' : ''})</small>` : ''}</span>
        ${canRemove ? `<button class="btn-danger" onclick="removeSection('${path}')">Remove ${kind}</button>` : ''}
      </div>
      <div class="form-group">
        <label>${kind} Title</label>
        <input type="text" value="${esc(sec.title)}" oninput="getSec('${path}').title = this.value; renderDocument();">
      </div>
      <div class="form-group">
        <label>${kind} Description (HTML Supported)</label>
        <input type="text" value="${esc(sec.description)}" oninput="getSec('${path}').description = this.value; renderDocument();">
      </div>

      <div class="row">
        <div>
          <button class="btn-secondary" style="width:100%;" onclick="toggleLogic('${path}', 'displayLogic')">
            ${sec.displayLogic.enabled ? 'Disable Display Logic' : '+ Add Display Logic'}
          </button>
        </div>
        <div>
          <button class="btn-secondary" style="width:100%;" onclick="toggleLogic('${path}', 'skipLogic')">
            ${sec.skipLogic.enabled ? 'Disable Skip Logic' : '+ Add Skip Logic'}
          </button>
        </div>
      </div>

      ${sec.displayLogic.enabled ? renderLogicEditor(path, 'displayLogic', 'Display Logic', upstreamFields) : ''}
      ${sec.skipLogic.enabled ? renderLogicEditor(path, 'skipLogic', 'Skip Logic', upstreamFields) : ''}

      <h4 style="margin-top:1rem;">${kind} ${label} Fields</h4>
      <div>${sec.fields.map((f, fIdx) => renderFieldEditor(f, path, fIdx)).join('')}</div>

      <div class="row" style="margin-top: 0.75rem;">
        <div><button onclick="addField('${path}')" class="btn-secondary" style="width:100%;">+ Add Field to ${label}</button></div>
        <div><button onclick="addSubsection('${path}')" class="btn-secondary" style="width:100%;">+ Add Subsection to ${label}</button></div>
      </div>

      ${subCount ? `
        <div class="subsections-wrap">
          <h4 style="margin:1rem 0 0.5rem 0;">Subsections of ${label}</h4>
          ${sec.subsections.map((sub, i) => renderSectionEditor(sub, `${path}.${i}`, depth + 1)).join('')}
        </div>` : ''}

      <div style="margin-top: 0.75rem;">
        <button onclick="addSectionAfter('${path}')" class="btn-primary-block" style="width:100%;">
          + Add ${kind} Below (${depth === 0 ? 'Section' : 'Subsection'} ${pathLabelNext(path)})
        </button>
      </div>
    </div>
  `;
}

// Label the next sibling would get, e.g. path "2" -> "4", "2.0" -> "3.2"
function pathLabelNext(path) {
  const parts = parsePath(path);
  parts[parts.length - 1] += 1;
  return parts.map(n => n + 1).join('.');
}

function renderLogicEditor(path, logicType, label, upstreamFields) {
  const logic = getSec(path)[logicType];
  return `
    <div class="logic-block">
      <div class="logic-header">
        <span>${label} Rules (Evaluated if prior fields match)</span>
        <select style="width: auto; padding: 0.2rem;" onchange="getSec('${path}')['${logicType}'].junction=this.value; renderDocument();">
          <option value="AND" ${logic.junction === 'AND' ? 'selected' : ''}>Match ALL (AND)</option>
          <option value="OR" ${logic.junction === 'OR' ? 'selected' : ''}>Match ANY (OR)</option>
        </select>
      </div>
      ${upstreamFields.length === 0 ? '<div style="font-size:0.8rem; color:red;">No upstream fields available from previous sections.</div>' : ''}
      ${logic.conditions.map((cond, cIdx) => `
        <div class="logic-rule-row">
          <select style="flex:2;" onchange="updateConditionField('${path}', '${logicType}', ${cIdx}, this.value)">
            <option value="">-- Select Controlling Upstream Field --</option>
            ${upstreamFields.map(uf => `
              <option value="${esc(uf.fieldId)}" ${cond.controllingFieldId === uf.fieldId ? 'selected' : ''}>
                ${esc(uf.title)} (${esc(uf.fieldName)} - ${esc(uf.fieldId)})
              </option>
            `).join('')}
          </select>
          <select style="flex:1.5;" onchange="getSec('${path}')['${logicType}'].conditions[${cIdx}].operator=this.value; renderDocument();">
            ${operatorOptions.map(op => `<option value="${op.val}" ${cond.operator === op.val ? 'selected' : ''}>${op.label}</option>`).join('')}
          </select>
          <input type="text" style="flex:1.5;" placeholder="Value" value="${esc(cond.value || '')}" oninput="getSec('${path}')['${logicType}'].conditions[${cIdx}].value=this.value; renderDocument();">
          <button class="btn-danger" onclick="removeCondition('${path}', '${logicType}', ${cIdx})">&times;</button>
        </div>
      `).join('')}
      <button class="btn-secondary" style="font-size:0.75rem; padding: 0.2rem 0.5rem;" onclick="addCondition('${path}', '${logicType}')">+ Add Condition</button>
    </div>
  `;
}

function renderFieldEditor(f, path, fIdx) {
  const fld = `getSec('${path}').fields[${fIdx}]`;
  return `
    <div class="card" style="background:#f4f5f7;">
      <div class="card-title">
        <span>Field: ${esc(f.title) || 'New Field'}</span>
        <button class="btn-danger" onclick="removeField('${path}', ${fIdx})">&times;</button>
      </div>
      <div class="row form-group">
        <div><label>Field ID</label><input type="text" value="${esc(f.fieldId)}" oninput="${fld}.fieldId=this.value; renderDocument();" onchange="renderEditor();"></div>
        <div><label>System Name</label><input type="text" value="${esc(f.name)}" oninput="${fld}.name=this.value; renderDocument();" onchange="renderEditor();"></div>
        <div><label>Display Title</label><input type="text" value="${esc(f.title)}" oninput="${fld}.title=this.value; renderDocument();" onchange="renderEditor();"></div>
      </div>
      <div class="form-group">
        <label>Description (Supports HTML/Links/Bold)</label>
        <textarea rows="2" oninput="${fld}.description=this.value; renderDocument();">${esc(f.description)}</textarea>
      </div>
      <div class="row form-group">
        <div>
          <label>Source Field Type (${esc(formData.sourceSystem)})</label>
          <select onchange="${fld}.dataType.sourceType=this.value; renderDocument();">
            ${sourceTypeOptions.map(t => `<option value="${t}" ${f.dataType.sourceType === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Target Field Type (${esc(formData.targetSystem)})</label>
          <select onchange="${fld}.dataType.targetType=this.value; renderDocument();">
            ${targetTypeOptions.map(t => `<option value="${t}" ${f.dataType.targetType === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <label><b>Source Mapping (${esc(formData.sourceSystem)})</b></label>
      <div class="row form-group">
        <div><input type="text" placeholder="Database ID" value="${esc(f.sourceMapping.databaseId)}" oninput="${fld}.sourceMapping.databaseId=this.value; renderDocument();"></div>
        <div><input type="text" placeholder="Table Name" value="${esc(f.sourceMapping.tableName)}" oninput="${fld}.sourceMapping.tableName=this.value; renderDocument();"></div>
        <div><input type="text" placeholder="Field Name" value="${esc(f.sourceMapping.fieldName)}" oninput="${fld}.sourceMapping.fieldName=this.value; renderDocument();"></div>
      </div>
      <label><b>Destination Mapping (${esc(formData.targetSystem)})</b></label>
      <div class="row form-group">
        <div><input type="text" placeholder="Database ID" value="${esc(f.destinationMapping.databaseId)}" oninput="${fld}.destinationMapping.databaseId=this.value; renderDocument();"></div>
        <div><input type="text" placeholder="Table Name" value="${esc(f.destinationMapping.tableName)}" oninput="${fld}.destinationMapping.tableName=this.value; renderDocument();"></div>
        <div><input type="text" placeholder="Field Name" value="${esc(f.destinationMapping.fieldName)}" oninput="${fld}.destinationMapping.fieldName=this.value; renderDocument();"></div>
      </div>
    </div>
  `;
}

/* ---------- logic actions ---------- */

function toggleLogic(path, logicType) {
  const sec = getSec(path);
  sec[logicType].enabled = !sec[logicType].enabled;
  renderEditor();
  renderDocument();
}

function addCondition(path, logicType) {
  getSec(path)[logicType].conditions.push({
    controllingFieldId: "",
    controllingFieldName: "",
    operator: "equals",
    value: ""
  });
  renderEditor();
  renderDocument();
}

function removeCondition(path, logicType, cIdx) {
  getSec(path)[logicType].conditions.splice(cIdx, 1);
  renderEditor();
  renderDocument();
}

function updateConditionField(path, logicType, cIdx, fieldId) {
  const match = getUpstreamFields(path).find(f => f.fieldId === fieldId);
  const cond = getSec(path)[logicType].conditions[cIdx];
  cond.controllingFieldId = match ? match.fieldId : "";
  cond.controllingFieldName = match ? match.fieldName : "";
  renderDocument();
}

/* ---------- section / field actions ---------- */

// New sibling directly below the section at `path` (same nesting level).
function addSectionAfter(path) {
  const { arr, index } = getContainer(path);
  const isTop = parsePath(path).length === 1;
  const num = pathLabelNext(path);
  arr.splice(index + 1, 0, newSection(`${isTop ? 'Section' : 'Subsection'} ${num}`));
  renderEditor();
  renderDocument();
}

// New child appended inside the section at `path`.
function addSubsection(path) {
  const sec = getSec(path);
  const num = `${pathLabel(path)}.${sec.subsections.length + 1}`;
  sec.subsections.push(newSection(`Subsection ${num}`));
  renderEditor();
  renderDocument();
}

// Used by the bottom "+ Add Form Section" button in index.html.
function addSection() {
  formData.sections.push(newSection(`Section ${formData.sections.length + 1}`));
  renderEditor();
  renderDocument();
}

function removeSection(path) {
  const { arr, index } = getContainer(path);
  const sec = arr[index];
  const nested = countNested(sec);
  if (nested > 0 && !confirm(`This will also remove ${nested} nested subsection(s). Continue?`)) return;
  arr.splice(index, 1);
  renderEditor();
  renderDocument();
}

function countNested(sec) {
  return (sec.subsections || []).reduce((n, s) => n + 1 + countNested(s), 0);
}

function addField(path) {
  getSec(path).fields.push({
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

function removeField(path, fIdx) {
  getSec(path).fields.splice(fIdx, 1);
  renderEditor();
  renderDocument();
}

/* ---------- document (preview / print) rendering ---------- */

function formatLogicSummary(logicObj, kind) {
  if (!logicObj || !logicObj.enabled || logicObj.conditions.length === 0) return '';
  return `
    <div class="logic-banner">
      <b>${kind} (${logicObj.junction} Match):</b>
      <ul>
        ${logicObj.conditions.map(c => {
          const opObj = operatorOptions.find(o => o.val === c.operator);
          const opLabel = opObj ? opObj.label : c.operator;
          const needsValue = c.operator !== 'isEmpty' && c.operator !== 'isNotEmpty';
          return `<li>Controlling Field: <b>${c.controllingFieldName || 'Unset'}</b> [<code>${c.controllingFieldId || 'Unset'}</code>] &mdash; ${opLabel}${needsValue ? ` <b>"${c.value || ''}"</b>` : ''}</li>`;
        }).join('')}
      </ul>
    </div>
  `;
}

function renderFieldRows(sec) {
  if (sec.fields.length === 0) return '';
  return `
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
  `;
}

function renderSectionDoc(sec, path, depth) {
  const label = pathLabel(path);
  const hasSubs = sec.subsections.length > 0;
  const hasFields = sec.fields.length > 0;
  const heading = depth === 0 ? 'h3' : 'h4';

  return `
    <div class="doc-section ${depth > 0 ? 'doc-subsection' : ''}">
      <div class="doc-section-header">
        <${heading}>${depth === 0 ? 'Section' : 'Subsection'} ${label}: ${sec.title}</${heading}>
        ${sec.description ? `<p style="margin: 0.25rem 0 0 0; font-size: 0.85rem;">${sec.description}</p>` : ''}
        ${formatLogicSummary(sec.displayLogic, 'Display Logic')}
        ${formatLogicSummary(sec.skipLogic, 'Skip Logic')}
      </div>
      ${hasFields ? renderFieldRows(sec) : (hasSubs ? '' : '<div style="padding:0.75rem; text-align:center; color:var(--text-subtle); font-size:0.85rem;">No fields in this section.</div>')}
      ${hasSubs ? `
        <div class="doc-subsections">
          ${sec.subsections.map((sub, i) => renderSectionDoc(sub, `${path}.${i}`, depth + 1)).join('')}
        </div>` : ''}
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
    ${formData.sections.map((sec, i) => renderSectionDoc(sec, String(i), 0)).join('')}
  `;
}

/* ---------- import / export ---------- */

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
    if (!file) return;
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = readerEvent => {
      try {
        formData = JSON.parse(readerEvent.target.result);
      } catch (err) {
        alert('Could not parse that file as JSON: ' + err.message);
        return;
      }
      normalizeSections(formData.sections);
      document.getElementById('formTitle').value = formData.formTitle;
      document.getElementById('sourceSystem').value = formData.sourceSystem || "";
      document.getElementById('targetSystem').value = formData.targetSystem || "";
      document.getElementById('formDesc').value = formData.description || "";
      renderEditor();
      renderDocument();
    };
  };
  input.click();
}

window.onload = init;
