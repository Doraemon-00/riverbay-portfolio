import type { TourIntro } from "./tour-onboarding";
export type GuideStep = { selector?: string; title: string; description: string; documentTarget?: boolean; intro?: TourIntro };
export type Guide = { id: string; label: string; steps: GuideStep[] };
const step = (selector: string | undefined, title: string, description: string): GuideStep => ({ selector, title, description });
const guide = (id: string, label: string, steps: GuideStep[]): Guide => ({ id, label, steps });

export function introductionSteps(page: string, admin: boolean, workspaceSeen: boolean, administrationSeen: boolean): GuideStep[] {
  const introductions: GuideStep[] = [];
  if (!workspaceSeen) introductions.push({
    selector:'nav[aria-label="Main navigation"]', documentTarget:true, intro:"workspace",
    title:"Your workspace",
    description:admin ? "The top bar stays the same on every page. My classes is for portfolio work. Administration manages classes, students and teacher access." : "The top bar stays the same on every page. My classes brings together the students and portfolios you can work on.",
  }, {
    selector:'.class-directory, .student-sidebar', intro:"workspace",
    title:"The list for this page",
    description:"The left column lists what this page works on: classes, or the students of a class. The choice at its top decides what the list shows.",
  });
  if (admin && page === "administration" && !administrationSeen) introductions.push({
    selector:'.administration-nav-options', intro:"administration", title:"Three places to manage the school",
    description:"Choose a section at the top of the left column. Classes organises groups. Students manages children’s records. Teachers manages staff accounts and access.",
  });
  return introductions;
}

/** Targets are visible controls, never field values or business actions. */
export function visibleTarget(root: ParentNode, selector: string): HTMLElement | undefined {
  if (selector === ":scope" && root instanceof HTMLElement) return root;
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).find(element =>
    element.isConnected && element.getClientRects().length > 0 && !element.closest("[hidden], [inert]")
    && getComputedStyle(element).visibility !== "hidden");
}

export function pageGuide(page: string, root: HTMLElement): Guide {
  if (page === "my-classes") return guide("my-classes", "Your class portfolios", [
    step('[aria-label="Portfolio semester"]', "Choose the semester", "The semester at the top of the list decides which classes and portfolios you see. Each semester keeps its own portfolio content."),
    step('.class-directory nav, .mobile-class-picker', "Choose a class", "Open a class to see its students. The number beside its name is the student count. My classes reopens the last class you worked in."),
    step('.roster-search', "Find a student", "Search by name or permanent student ID."),
    step('.roster-student', "Open a portfolio", "Click the student row to open their portfolio, or a domain status to go straight to that area."),
    step('.roster-domains', "Follow their progress", "Not started: no saved work. In progress: partly filled. Ready for PDF: indicator and learning story saved."),
    step('.directory-empty', "Nothing here yet?", "Clear your search to see more students. If the class is empty or unassigned, ask your administrator to set it up."),
  ]);
  if (page === "portfolio") return guide("portfolio", "Work on a portfolio", [
    step('.student-sidebar [aria-label="Portfolio semester"]', "Switch semester", "Open this student’s portfolio in another semester. The same domain stays open."),
    step('.student-sidebar .sidebar-class-navigation', "Change class", "The arrows open the previous or next class. Select the class name to choose from all your classes."),
    step('.student-sidebar .search-field, .mobile-student-selector button', "Find another student", "Search the class by name or ID. Previous and Next also move between students."),
    step('.crumb-link', "Back to the class", "Open this class’s list on My classes."),
    step('.domain-tabs a[aria-current="page"]', "Choose a domain", "Open a domain tab. Its stamp fills as you save: mint circle for the indicator, animal for the story."),
    step('.rating-options', "Choose an indicator", "Choose the level that best reflects your observations."),
    visibleTarget(root, '.return-link')
      ? step('.return-link', "Return to where you were", "Go back to the report you came from, on the domain that is open now.")
      : step('.previous-rating-link', "Compare with Semester 1", "See the Semester 1 indicator here. View Semester 1 report opens it on the same domain, with a way back."),
    step('.observation-panel .section-heading button', "Record a moment", "Add a short factual observation. Set when it happened, or leave the date blank for a general note."),
    step('.draft-toolbar > button', "Draft a starting point", "Use this domain’s observations to draft a narrative. Review its facts and wording before choosing Use draft."),
    visibleTarget(root, '.draft-actions .primary')
      ? step('.draft-actions .primary', "Make it your own", "Use draft replaces the narrative. Edit the wording before saving.")
      : step('.narrative-panel textarea', "Make it your own", "Write the learning story here, or edit an AI draft after using it. You decide the final wording."),
    step('.save-bar > button', "Save your work", "Save the indicator, observations and story together. Leaving unsaved work offers a choice to save, discard or stay."),
    step('.photo-toolbar', "Add a few moments", "Upload fictional images or add a placeholder. Photos are optional and save immediately."),
    step('.pdf-create-controls', "Create their portfolio", "Once every domain has a saved indicator and story, choose an orientation and download the PDF."),
  ]);
  if (page === "empty-class") return guide("empty-class", "Continue from an empty class", [
    step('.portfolio-empty-state h2', "No students yet", "There are no student portfolios in this class yet."),
    step('.class-title-picker, .mobile-student-selector button', "Choose another class", "Choose a different class to continue. Your semester and learning area stay selected."),
    step('.student-sidebar [aria-label="Portfolio semester"]', "Try another semester", "Open My classes for another semester of this class."),
  ]);
  if (page === "administration") return adminGuide(root);
  if (page === "setup") return guide("setup", "Local setup help", [
    step('ol', "Start the local environment", "Follow these commands with Docker running. See the repository README for setup details."),
    step('a', "Continue to sign-in", "After setup, use your staff account to sign in."),
  ]);
  return guide("recovery", "Page recovery", [
    step('button.primary, a.primary', "Continue from here", "Try the available recovery action. If the problem continues, contact your administrator."),
  ]);
}

function adminGuide(root: HTMLElement): Guide {
  const studentAction = visibleTarget(root, '#admin-students tbody .text-action');
  const restoring = studentAction?.textContent?.trim().startsWith('Restore');
  if (visibleTarget(root, '#admin-students')) return guide("admin-students", "Manage students", [
    step('#admin-students .search-field', "Find a student", "Search across the school by name or permanent student ID."),
    step('#admin-students [aria-label="Student class"]', "Narrow the list", "Choose the academic year and class. Unassigned finds students without an active class in that year."),
    step('#admin-students .admin-heading > button', "Add a student", "Create a student record. A permanent ID is assigned automatically."),
    step('#admin-students .selection-column', "Work with several students", restoring ? "Select students to restore several records together." : "Select students to reveal bulk assignment and archive actions."),
    step('#admin-students tbody .text-action', restoring ? "Restore a student" : "Assign a class", restoring ? "Restore the student to a class or leave them unassigned. Their ID and portfolio history remain." : "Choose a class for both semesters. This replaces the selected year’s class assignment and keeps saved portfolios."),
    step('#admin-students [aria-label="Student records"]', "Find archived students", "Archive keeps portfolio history. Choose Archived to find and restore students, even after they leave their old class."),
  ]);
  if (visibleTarget(root, '#admin-teachers')) return guide("admin-teachers", "Manage teachers", [
    step('#admin-teachers .search-field', "Find a teacher", "Search by name, staff ID or sign-in email."),
    step('#admin-teachers .admin-heading > button', "Add a teacher", "Create a staff account. Save the sign-in details shown afterward; no invitation email is sent."),
    step('#admin-teachers tbody .text-action', "Manage class access", "Choose the classes one teacher can access. Unchecking a class removes their access to it."),
    step(visibleTarget(root, '#admin-teachers .bulk-toolbar') ? '#admin-teachers .bulk-toolbar > button' : '#admin-teachers .selection-column', "Assign classes together", "Select several teachers, then Assign classes. Bulk assignment adds access and keeps their existing classes."),
    step('#admin-teachers [aria-label="Teacher accounts"]', "Archive and restore staff", "Archive blocks sign-in while keeping their records. Find archived staff here; review their class access before restoring."),
  ]);
  const selected = visibleTarget(root, '.admin-tabs button[aria-current="page"]')?.dataset.tourTab ?? "students";
  if (selected === "settings") return guide("class-settings", "Class settings", [
    step('[data-tour="class-rename"] .settings-fields', "Update class details", "Change the name or level while keeping the class’s membership and portfolios."),
    step('[data-tour="class-archive"] button', "Archive or restore", "Archiving hides the class from teacher workspaces while retaining its membership and portfolios. Restore it to resume access."),
    step('[data-tour="class-clear"] button', "Clear the grouping", "Move students to Unassigned and remove teacher assignments. Student records and saved portfolios remain."),
  ]);
  if (selected === "teachers") return guide("class-teachers", "Teachers in this class", [
    step('.class-detail .directory-toolbar > button', "Add teachers", "Choose existing staff to give them access to this class for both semesters."),
    step('.class-detail .selection-column', "Remove class access", "Select teachers to remove their access to this class. Their accounts and other class assignments remain."),
  ]);
  return guide("classes", "Manage classes", [
    step('[aria-label="Academic year"]', "Choose the academic year", "The year at the top of the class list decides which classes it shows. Both semesters use the same class grouping."),
    step('.class-directory nav[aria-label="Choose class"], .mobile-class-picker', "Choose a class", "Select a class, or Unassigned to find students without an active class in this year."),
    step('.rail-add-class', "Add a class", "Create a year, level and class name, then assign its students and teachers."),
    step('.admin-tab-options', "Manage this group", "Students handles membership, Teachers handles access, and Settings handles class details and archiving."),
    step('.class-detail .directory-toolbar > button', "Add students", "Select existing students together. Moving from another class keeps their saved portfolios."),
    step('.class-detail .selection-column', "Work with a group", "Select students to move, unassign or archive them. Removing class membership leaves the child’s record and portfolio intact."),
  ]);
}

/** Only forms with meaningful choices need their own inline guide. */
export function dialogGuide(kind: string): Guide | null {
  const submit = '.dialog-actions .primary';
  const name = 'input[name="name"]';
  const assignment = step('.settings-fields', "Choose their class", "Choose the year and class. This assignment covers both semesters; Leave unassigned keeps the record without class access.");
  const year = step('[data-tour="assignment-year"], input[name="year"]', "Choose the year", "Work on class assignments for this academic year.");
  switch (kind) {
    case 'class-create': return guide(kind, "Add a class", [
      step('.settings-fields', "Set the year and level", "The year distinguishes this group from another year with the same class name."),
      step(name, "Name the class", "Enter the class name, for example Willow."),
      step(submit, "Create the grouping", "Create the class first. Assign its students and teachers afterward."),
    ]);
    case 'student-create': return guide(kind, "Add a student", [
      step(name, "Name the student", "Enter the student’s name. Their permanent ID is assigned automatically."), assignment,
      step(submit, "Add the record", "Create the student with the class assignment shown above."),
    ]);
    case 'teacher-create': return guide(kind, "Add a teacher", [
      step(name, "Name the teacher", "Enter the name shown in the staff directory."),
      step('input[name="email"]', "Set the sign-in email", "Use the email this teacher will sign in with."),
      step('.optional-assignments summary', "Assign classes if ready", "Choose initial classes here, or assign them later from Manage classes."),
      step(submit, "Create their account", "Save the sign-in details shown next. No invitation email is sent."),
    ]);
    case 'teacher-access': return guide(kind, "Manage class access", [year,
      step('.people-picker', "Choose their classes", "Checked classes are accessible to this teacher. Unchecking an active class removes access."),
      step(submit, "Save this access list", "Apply the checklist for both semesters of this year. Other years’ assignments remain."),
    ]);
    case 'teacher-bulk': return guide(kind, "Assign classes together", [year,
      step('.people-picker', "Choose classes to add", "Add these classes to all selected teachers. Their existing class access stays."),
      step(submit, "Apply to the selected teachers", "Add access for both semesters of this year."),
    ]);
    case 'assign-students': return guide(kind, "Assign students", [
      step('[aria-label="Student source"]', "Choose where to look", "Unassigned shows students without a class. All active students also lets you move students from another class."),
      step('.people-picker', "Choose the students", "Select existing students to move into this class. Their saved portfolios stay with them."),
      step('.settings-fields', "Choose the destination", "Assign the selected students to this year and class. Existing membership in that year will be replaced."),
      step('.dialog-actions', "Check the selection", "Check the selected count before applying. Selections can include names hidden by your search."),
    ]);
    case 'assign-teachers': return guide(kind, "Add teachers to this class", [
      step('.picker-search', "Find staff", "Search existing teachers by name, staff ID or email."),
      step('.people-picker', "Choose teachers", "Select who should access this class for both semesters."),
      step('.dialog-actions', "Check and add", "Check the selected count, including any selections hidden by search, then add their access."),
    ]);
    case 'restore-students': return guide(kind, "Restore students", [assignment,
      step(submit, "Restore their records", "Return students to a class or leave them unassigned. Their IDs and saved portfolios are retained."),
    ]);
    default: return null;
  }
}
