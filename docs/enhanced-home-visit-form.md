# Enhanced Home Visit Form Documentation

## Overview

The Enhanced Home Visit Form implements the updated operating requirements based on Chapter 749 Standards with RCC (Residential Child Care) Requirements and T3C (Trauma-Competent Care) Elements.

**Version:** 3.1  
**Last Updated:** November 2025  
**Based On:** `enhanced-monitoring-checklist.md`

---

## Key Features

### 1. **Form Type Selection**
The form now supports three distinct visit types:
- **Monthly Visits**: Lighter touch, routine observations and foster parent check-ins
- **Quarterly Visits**: Comprehensive compliance reviews with all 13 sections
- **Annual Visits**: Most thorough review including all compliance requirements

The form automatically adjusts sections based on the form type selected.

### 2. **Simplified Child Interactions for Liaisons**
As requested, home visit liaisons now have a simplified "Children Present" section that captures:
- Child's name, age, and presence during visit
- Basic behavior and interaction notes from cursory observations
- School and medical/therapy notes if naturally mentioned
- ASQ screening tracking (for ages 10+)

**No formal child interviews** are required for liaisons. Full interviews are conducted by case managers during quarterly reviews.

### 3. **Comprehensive Compliance Tracking**

The form includes 13 major compliance sections:

#### Section 1: Medication (§749.1463, §749.1521, RCC 5420)
- Original container storage
- Double-lock requirements
- Refrigeration compliance
- MAR (Medication Administration Record) tracking
- Psychotropic medication documentation
- PRN usage documentation (T3C development)

#### Section 2A: Inspection Documentation (§749.2905)
- **Fire Inspection**: Dates, expiration tracking, certificate numbers
- **Health Inspection**: Complete tracking with auto-calculated days until expiration
- **Fire Extinguisher Inspections**: Multiple location tracking with tag and gauge verification
- Visual indicators for expiration status (green = current, yellow = renewal soon, red = expired)

#### Section 2B: General Health and Safety (§749.2907-3041)
- Disaster and emergency plans
- Smoke detectors and fire extinguishers
- Weapons/firearms storage (updated 2021 requirements)
- Indoor/outdoor cleanliness and safety
- Hazardous substances

#### Section 3: Children's Rights & Well-Being (§749.1003, RCC 1110-3610)
- Rights posters (English & Spanish)
- DFPS Statewide Intake number display
- Foster Care Ombudsman poster
- Normalcy activities
- Sibling visit compliance
- CANS assessment integration (T3C development)

#### Section 4: Bedrooms and Belongings (§749.3021-3033)
- Square footage requirements
- Privacy and natural light
- Age/gender appropriate arrangements
- Storage space
- Clothing and hygiene supplies

#### Section 5: Education & Life Skills (§749.1893, RCC 6100-6700)
- Education Portfolio maintenance
- Study space and homework time
- School enrollment
- Life skills training (2+ activities/month)
- Casey Life Skills Assessment (age 14+)
- PAL enrollment (age 14+)
- Experiential learning (T3C development)

#### Section 6: Other Indoor Space (§749.2595-3081)
- Video surveillance compliance
- Indoor activity space (40 sq ft per child)
- Bathroom ratios
- Food storage and preparation areas

#### Section 7: Documentation & Service Planning (RCC 1420-6700)
- Placement authorization (Form 2085FC)
- Medical consenter (Form 2085-B)
- Service plans (Form 3300)
- Placement summary (Form K-908-2279)
- Medical and dental checkups
- CANS assessments
- Health Passport access

#### Section 8: Trauma-Informed Care & Training (RCC 5510-5600)
- Pre-service and annual trauma-informed care training
- Psychotropic medication training
- Suicide prevention training (1 hr pre-service, biennial)
- **TBRI Strategy Tracking**: Connecting, Empowering, Correcting strategies (T3C development)

#### Section 9: Foster Parent Interview Summary
- Individual child discussion tracking
- Support needs assessment (training, respite, resources, behavioral support)
- Follow-up requirement tracking

#### Sections 10-13: Conditional Sections (If Applicable)
- **Section 10: Outdoor Space** (§749.3039-3041)
- **Section 11: Vehicles** (§749.3101-3109, RCC 3620)
- **Section 12: Swimming Areas** (§749.3133, §749.3147)
- **Section 13: Infants** (§749.1803-1815, RCC 4810)

Each section can be marked as applicable/not applicable to streamline the visit process.

### 4. **T3C Development Tracking**
Items marked with **"T3C-Dev"** are for development and preparation only, not compliance monitoring:
- PRN usage documentation with specific behaviors/symptoms
- CANS assessment incorporation
- Experiential learning opportunities
- TBRI strategy observations (Connecting, Empowering, Correcting)
- Electronic documentation system development
- Trauma-informed practices assessment

These items are visually distinguished with blue badges and help prepare homes for future T3C certification.

### 5. **Quality Enhancement Section**
A dedicated section for observing trauma-informed practices:
- Proactive behavior management strategies
- Co-regulation techniques
- Sensory needs accommodation
- Voice and choice for children
- Playful engagement

**Status Options:** Observed, In Development, Not Yet Started

### 6. **Follow-Up Items Tracking**
Track resolution of issues from previous visits with:
- Previous issue description
- Current status (Resolved, In Progress, New Plan)
- Resolution details
- Additional notes

### 7. **Corrective Actions Management**
Document deficiencies requiring corrective action:
- Issue description
- Standard/requirement violated (e.g., §749.1521)
- Action required
- Due date
- Additional notes

Visual indicators highlight corrective actions with red borders.

### 8. **Visit Summary & Planning**
Comprehensive visit summary includes:
- **Overall Compliance Status**: Fully Compliant, Substantially Compliant, Corrective Action Required, Immediate Intervention Needed
- **Key Strengths** (top 3)
- **Priority Areas for Next Visit** (with actions planned)
- **Resources Provided** tracking
- **Next Visit Scheduling**

### 9. **Enhanced Signatures Section**
Collects all required signatures:
- Visitor signature with date
- Foster Parent 1 signature with date (required)
- Foster Parent 2 signature with date (if applicable)
- Supervisor signature with date (required)

---

## Form Flow

### Monthly Visit Flow (Estimated 30-45 minutes)
1. Visit Information
2. Foster Home Info
3. Children Present (simplified)
4. Foster Parent Interview
5. Observations
6. Follow-Up Items (if any)
7. Visit Summary
8. Signatures

### Quarterly Visit Flow (Estimated 90-120 minutes)
1. Visit Information
2. Foster Home Info
3-13. All Compliance Sections (Medication through Infants)
14. Quality Enhancement (T3C)
15. Children Present (simplified for liaisons)
16. Foster Parent Interview
17. Observations
18. Follow-Up Items
19. Corrective Actions (if needed)
20. Visit Summary
21. Signatures

---

## Conditional Rendering

The form automatically adjusts based on:

1. **Form Type (Monthly/Quarterly/Annual)**
   - Monthly: Simplified sections only
   - Quarterly/Annual: Full compliance sections

2. **Applicable Sections**
   - Outdoor Space, Vehicles, Swimming Areas, Infants can be marked N/A
   - Only applicable sections show compliance items

3. **ASQ Screening (Ages 10+)**
   - Automatically shows ASQ tracking for children age 10 and older
   - Quarterly requirement reminder displayed

4. **T3C Development Items**
   - Visually distinguished with blue badges
   - Status options: Developing (default), Observed, Compliant, Non-Compliant, N/A

---

## Status Indicators

### Compliance Items
- **✓ Compliant** (Green): Meets requirements
- **⚠ Non-Compliant** (Red): Deficiency identified
- **N/A** (Gray): Not applicable

### Inspection Expiration
- **Current** (Green): >60 days remaining
- **Renewal Soon** (Yellow): 31-60 days remaining
- **Expiring Soon** (Orange): 1-30 days remaining
- **EXPIRED** (Red): Immediate action required

### Overall Compliance Status
- **Fully Compliant** (Green)
- **Substantially Compliant with Minor Issues** (Yellow)
- **Corrective Action Required** (Orange)
- **Immediate Intervention Needed** (Red)

---

## Critical Reminders

### ASQ Suicide Screening
- **REQUIRED** for all children age 10+ every 90 days
- Quarterly months: March, June, September, December
- If any positive screen on ASQ, follow immediate safety protocols

### Child Interviews
- Liaisons: Simplified presence documentation only (cursory interaction)
- Case Managers: Full interview capabilities during quarterly reviews
- Interviews should be conducted privately when possible

### Documentation Best Practices
- Document all observations objectively
- Add notes for any item that needs additional documentation
- Check "Notes?" boxes before concluding visit
- Provide resources and support before citing deficiencies

### Inspection Tracking
- Fire and health inspections must be renewed annually
- Fire extinguisher inspections documented for all locations
- Auto-calculated days until expiration helps prevent lapses

---

## Database Storage

The form data is stored as JSON in the `visits` table, maintaining compatibility with existing data while supporting the enhanced structure.

**Key Fields:**
- `form_type`: "monthly", "quarterly", "annual"
- `form_version`: "3.1"
- All compliance sections stored as nested objects
- Inspection dates stored for expiration tracking
- Follow-up items and corrective actions as arrays

---

## Integration with Existing System

### Generating Quarterly Reports
Monthly visits capture all necessary data to generate quarterly summaries:
- Observations and concerns aggregated
- Follow-up items tracked across visits
- Compliance issues identified early

### Future Enhancements
- Auto-population of home information from database
- Staff assignment and scheduling integration
- Electronic signature capture
- PDF generation for printing
- Email delivery to foster parents
- Dashboard analytics for compliance tracking

---

## Technical Implementation

### Files
- `components/forms/home-visit-form-enhanced.tsx`: Main form component
- `components/forms/home-visit-form-enhanced-sections.tsx`: Additional section components
- `docs/enhanced-monitoring-checklist.md`: Original requirement specifications

### Key Technologies
- React hooks for state management
- Shadcn/ui components for consistent styling
- Conditional rendering based on form type
- Auto-calculated fields (quarter, expiration days)
- Real-time validation (coming soon)

### State Management
The form uses a single comprehensive state object with nested sections, allowing for:
- Easy data serialization to JSON
- Efficient updates with path-based changes
- Clear section organization
- Support for dynamic arrays (children, follow-ups, corrective actions)

---

## Usage Instructions

### For Home Visit Liaisons

1. **Start a New Monthly Visit**
   - Select "Monthly" as form type
   - Enter visit information and staff details
   - Complete foster home information (auto-populated if available)

2. **Document Children Present**
   - Add each child present during visit
   - Note basic interactions and observations
   - Mark ASQ screening status for ages 10+

3. **Foster Parent Interview**
   - Discuss each child (behaviors, school, medical)
   - Identify support needs
   - Mark follow-up required as needed

4. **Record Observations**
   - Document environmental observations
   - Note family dynamics and interactions
   - Add recommendations as appropriate

5. **Complete Visit Summary**
   - Select overall status
   - Highlight key strengths
   - Set priorities for next visit
   - Schedule next visit

6. **Collect Signatures**
   - Your signature
   - Foster parent signature(s)
   - Submit for supervisor review

### For Quarterly/Annual Reviews

Follow the same process but also complete all compliance sections (1-13). The form will guide you through each section with clear requirements and compliance tracking.

---

## Support

For questions or issues with the Enhanced Home Visit Form:
- Review this documentation
- Check `docs/v0-development-instructions.md` for development guidelines
- Refer to `enhanced-monitoring-checklist.md` for requirement details
- Contact your supervisor for policy clarifications

---

## Version History

### Version 3.1 (November 2025)
- Initial release of enhanced form
- Support for Monthly, Quarterly, and Annual visits
- Comprehensive 13-section compliance tracking
- T3C development elements integrated
- Simplified child presence documentation for liaisons
- Auto-calculated inspection expiration tracking
- Follow-up items and corrective actions management
- Enhanced visit summary and planning

### Version 3.0 (Previous)
- Original comprehensive form with quarterly variants
- TAC 749 compliance checklist
- Role-based sections (liaison vs case manager)
- Basic child and parent interviews

---

## Next Steps

1. **Testing**: Thoroughly test the form with sample data
2. **Training**: Provide training to all staff on new form structure
3. **Feedback**: Collect feedback from liaisons and case managers
4. **Refinement**: Adjust based on real-world usage
5. **Integration**: Connect with existing scheduling and reporting systems
6. **Analytics**: Build dashboard for compliance tracking and trends

