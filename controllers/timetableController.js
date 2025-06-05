import Allocation from '../models/Allocation.js';
import GeneratedTimetable from '../models/GeneratedTimetable.js';
import Subject from '../models/Subject.js';
import Course from '../models/Course.js';
import Class from '../models/Class.js';
import Staff from '../models/Staff.js';
import { Op } from 'sequelize';
// import Section from '../models/Section.js';
import Timetable from '../models/Timetable.js';
// Save Allocations
export const saveAllocations = async (req, res) => {
  try {
    const { allocations, timeConfig } = req.body;
    const staffIds = [...new Set(allocations.map(alloc => alloc.staff_id))];
    const staffList = await Staff.findAll({ where: { staff_id: staffIds, is_active: true } });
    const staffMap = new Map(staffList.map(staff => [staff.staff_id, staff.staff_name]));
    for (const alloc of allocations) {
      if (alloc.staff_id) {
        await Subject.update(
          { staff_id: alloc.staff_id },
          { where: { subject_id: alloc.subject_id, is_active: true } }
        );
      }
    }
    const savedAllocations = await Allocation.bulkCreate(
      allocations.map(alloc => ({
        school_id: alloc.school_id,
        department_id: alloc.department_id,
        course_id: alloc.course_id,
        subject_id: alloc.subject_id,
        subject_name: alloc.subject_name,
        staff_id: alloc.staff_id,
        staff_name: staffMap.get(alloc.staff_id),
        theory_credits: alloc.theory_credits,
        lab_credits: alloc.lab_credits,
        time_config: timeConfig,
        is_active: true
      })),
      { ignoreDuplicates: true, returning: true }
    );
    res.status(201).json({ message: "Allocations saved successfully", data: savedAllocations });
  } catch (error) {
    res.status(500).json({ message: 'Error saving allocations', error: error.message });
  }
};
const projectSubjectsAll = new Set(); // Fix: define projectSubjectsAll as a Set to avoid ReferenceError

// Helper function to get available subjects for a slot
const getAvailableSubjects = (subjectTracker, day, isLab, staffDayAssignments, timeSlot, semester, allTimetableSlots) => {
  // Get subjects for the current semester
  const semesterSubjects = Array.from(subjectTracker.entries())
    .filter(([key, sub]) => sub.semester === semester)
    .map(([key, sub]) => sub);
  // Sort subjects by priority and credit needs
  const sortedSubjects = semesterSubjects.sort((a, b) => {
    const aDailySlots = [...(a.usedInDays || [])].filter(d => d === day).length;
    const bDailySlots = [...(b.usedInDays || [])].filter(d => d === day).length;
    const aWeeklySlots = isLab 
      ? [...(a.labUsedInDays || [])].length 
      : [...(a.usedInDays || [])].length;
    const bWeeklySlots = isLab
      ? [...(b.labUsedInDays || [])].length
      : [...(b.usedInDays || [])].length;
    // First priority: Subjects that haven't met their minimum requirements
    const aRemainingRequired = isLab 
      ? (a.total_lab_credits - aWeeklySlots)
      : (a.total_theory_credits - aWeeklySlots);
    const bRemainingRequired = isLab
      ? (b.total_lab_credits - bWeeklySlots)
      : (b.total_theory_credits - bWeeklySlots);
    if (aRemainingRequired !== bRemainingRequired) {
      return bRemainingRequired - aRemainingRequired; // Higher remaining credits = higher priority
    }
    // Second priority: Even distribution across days
    return aDailySlots - bDailySlots;
  });
  return sortedSubjects.filter(sub => {
    if (!sub) return false;
    const dailySlots = isLab 
      ? [...(sub.labUsedInDays || [])].filter(d => d === day).length
      : [...(sub.usedInDays || [])].filter(d => d === day).length;
    const weeklySlots = isLab
      ? [...(sub.labUsedInDays || [])].length
      : [...(sub.usedInDays || [])].length;
    // For lab slots
    if (isLab) {
      const withinDailyLabLimit = dailySlots < 1; // Only one lab per day
      const withinWeeklyLabLimit = weeklySlots < sub.total_lab_credits;
      const hasRemainingLabCredits = sub.lab_credits > 0;
      const canAccommodateLabSlot = (timeSlot.duration || 0) >= (sub.labDuration || 120);
      return hasRemainingLabCredits && withinDailyLabLimit && withinWeeklyLabLimit && canAccommodateLabSlot;
    }
    // For theory slots
    // Basic credit checks
    const hasRemainingCredits = sub.theory_credits > 0;
    const withinDailyLimit = dailySlots === 0; // Strict check: no repeats in same day
    const withinTotalLimit = weeklySlots < sub.total_theory_credits;
    const meetsBasicRequirements = hasRemainingCredits && withinDailyLimit && withinTotalLimit;
    if (!meetsBasicRequirements) return false;
    // Check if this subject or its pair is already scheduled for this day
    const subjectAlreadyScheduled = allTimetableSlots.some(slot => {
      if (sub.isMinorPaired && sub.pairedSubject) {
        // Create standardized pair name
        const pairNames = [sub.name, sub.pairedSubject.name].sort();
        const standardPairName = `${pairNames[0]} / ${pairNames[1]}`;
        return slot.subject_name === standardPairName && 
               slot.day === day && 
               slot.slot_type === 'theory';
      }
      return slot.subject_id === sub.id && 
             slot.day === day && 
             slot.slot_type === 'theory';
    });
    if (subjectAlreadyScheduled) return false;        // Special handling for minor subjects
    if (sub.subject_category === 'Minor(Elective)' || sub.subject_category === 'Minor (Elective)') {
      if (sub.isMinorPaired) {
        // For paired minors, check both total pair slots and individual subject slots
        const totalPairedTheorySlots = allTimetableSlots.filter(s =>
          (s.subject_id === sub.id || s.subject_id === sub.pairedSubject?.id) &&
          s.slot_type === 'theory'
        ).length;          // Create standardized pair name to ensure consistent slot counting
          const pairNames = [sub.name, sub.pairedSubject.name].sort();
          const standardPairName = `${pairNames[0]} / ${pairNames[1]}`;

          // Count total slots for this standardized pair name
          const totalPairSlots = allTimetableSlots.filter(s =>
            s.subject_name === standardPairName && 
            s.slot_type === 'theory'
          ).length;

          console.log(`Checking Minor Theory Slots:`, {
            pairName: standardPairName,
            currentSlots: totalPairSlots,
            maxAllowed: 3
          });

          // Strictly enforce 3 slots total per pair
          return totalPairSlots < 3;
      }
      return true; // Regular minor subject within limits
    }
    // For major subjects (including PROJECT)
    const maxDailySlots = sub.maxDailySlotsAllowed;
    const shouldAdd = dailySlots < maxDailySlots && // Hasn't exceeded daily limit
      weeklySlots < sub.total_theory_credits; // Hasn't exceeded total credits
    // For projects, no staff check needed
    const isProject = sub.subject_category?.toLowerCase().includes('project') || 
                     sub.subject_name?.toUpperCase().includes('PROJECT');
    if (isProject) {
      // For projects, ensure they get priority and their slots are properly filled
      projectSubjectsAll.add(sub.id);
      return shouldAdd;
    }
    
    // Check for staff clash for non-project subjects
    // For projects, we don't need staff check
    if (sub.subject_category?.toLowerCase().includes('project') || 
        sub.subject_name?.toUpperCase().includes('PROJECT')) {
      return shouldAdd;
    }

    // For non-project subjects, check staff availability
    if (!shouldAdd || !sub.staff_id) return shouldAdd;
    const timeKey = `${timeSlot.start}-${timeSlot.end}`;
    const assignedStaff = staffDayAssignments[timeKey] || [];
    return !assignedStaff.includes(sub.staff_id);
  });
};

// Helper function to find a random subject without staff clash
const getRandomSubjectWithoutClash = (subjectTracker, day, isLab, staffDayAssignments, timeSlot, semester, includeUsed = false) => {
  // Get subjects for the current semester only
  const semesterSubjects = Array.from(subjectTracker.entries())
    .filter(([key, sub]) => sub.semester === semester)
    .map(([key, sub]) => sub);
  const available = semesterSubjects.filter(sub => {
    if (!sub) return false;
    const hasCredits = isLab
      ? (sub.lab_credits > 0 && !sub.labUsedInDays.has(day))
      : (sub.theory_credits > 0 && !sub.usedInDays.has(day));
    if (!hasCredits) return false;
    // Check if staff is already assigned at this time slot
    if (!sub.staff_id) return true;
    const timeKey = `${timeSlot.start}-${timeSlot.end}`;
    const assignedStaff = staffDayAssignments[timeKey] || [];
    return !assignedStaff.includes(sub.staff_id);
  });
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};
// Create slot with staff
const createSlotWithStaff = async (slotData, staffId) => {
  if (staffId) {
    try {
      const staff = await Staff.findByPk(staffId);
      if (staff) {
        console.log(`Found staff for ID ${staffId}:`, staff.staff_name);
        return {
          ...slotData,
          staff_id: staff.staff_id,
          staff_name: staff.staff_name
        };
      }
    } catch (error) {
      console.error(`Error finding staff with ID ${staffId}:`, error);
    }
  }
  return slotData;
};
// Helper to check for staff clash
const hasStaffClash = (slots, newSlot) => {
  if (!newSlot.staff_id) return false;
  return slots.some(slot => {
    return slot.staff_id === newSlot.staff_id &&
      slot.day === newSlot.day &&
      slot.start_time === newSlot.start_time &&
      slot.end_time === newSlot.end_time;
  });
};
// Helper function to generate time slots from timeConfig
const generateTimeSlots = (timeConfig) => {
  if (!timeConfig || typeof timeConfig !== 'object') {
    console.error('Invalid timeConfig:', timeConfig);
    return [];
  }
  // Map frontend timeConfig fields to backend fields
  const {
    dayStart: startTime,
    dayEnd: endTime,
    theoryDuration: slotDuration,
    breakDuration = 0,
    lunchStart: lunchTime,
    lunchDuration = 60
  } = timeConfig;
  // Validate required parameters
  if (!startTime || !endTime || !slotDuration) {
    console.error('Missing required timeConfig parameters');
    return [];
  }
  // Convert time strings to Date objects for comparison
  const slots = [];
  let currentTime = new Date(`2000-01-01T${startTime}`);
  const endTimeDate = new Date(`2000-01-01T${endTime}`);
  while (true) {
    const start = currentTime.toTimeString().slice(0, 5);
    
    // Check if current time EQUALS OR EXCEEDS end time before adding a new slot
    // This ensures we include the final slot
    if (currentTime >= endTimeDate) {
      break;
    }
    // Check if this is lunch time
    if (lunchTime && start === lunchTime) {
      slots.push({
        isLunch: true,
        start: lunchTime,
        end: new Date(currentTime.getTime() + (lunchDuration || 60) * 60000).toTimeString().slice(0, 5)
      });
      currentTime = new Date(currentTime.getTime() + (lunchDuration || 60) * 60000);
      if (breakDuration) {
        currentTime = new Date(currentTime.getTime() + breakDuration * 60000);
      }
      continue;
    }
    // Add regular slot
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
    const end = slotEnd.toTimeString().slice(0, 5);
    
    // Check if this is a GE slot
    const isGE = start === timeConfig.geStart && end === timeConfig.geEnd;
    
    slots.push({
      start,
      end,
      isRegular: !isGE,
      isGE: isGE // Mark GE slots specifically
    });
    // Add break time between slots
    currentTime = new Date(slotEnd.getTime() + (breakDuration || 0) * 60000);
  }
  console.log('Generated slots:', slots);
  return slots;
};
// Generate Timetable
export const generateTimetable = async (req, res) => {
  try {
    const { school_id, department_id, timeConfig, semesterType } = req.body;
    console.log('Generate Timetable - Input:', { school_id, department_id, semesterType, timeConfig });
    if (!school_id || !department_id || !timeConfig || !semesterType) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Shuffle days array to distribute free slots more evenly
    for (let i = days.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [days[i], days[j]] = [days[j], days[i]];
    }
    const oddSemesters = [1, 3, 5, 7];
    const evenSemesters = [2, 4, 6, 8];
    const targetSemesters = semesterType === 'odd' ? oddSemesters : evenSemesters;
    const classes = await Class.findAll({
      where: {
        semester: { [Op.in]: targetSemesters },
        is_active: true
      },
      include: [{
        model: Course,
        where: {
          school_id,
          department_id,
          is_active: true
        },
        required: true
      }],
      order: [['semester', 'ASC']]
    });
    const classesByCourse = classes.reduce((acc, cls) => {
      if (!acc[cls.course_id]) acc[cls.course_id] = [];
      acc[cls.course_id].push(cls);
      return acc;
    }, {});
    if (!timeConfig || typeof timeConfig !== 'object') {
      throw new Error('Invalid timeConfig object');
    }
    if (!timeConfig.dayStart || !timeConfig.dayEnd || !timeConfig.theoryDuration) {
      throw new Error('Missing required timeConfig parameters: dayStart, dayEnd, or theoryDuration');
    }
    const timeSlots = generateTimeSlots(timeConfig);
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      throw new Error('Failed to generate valid time slots');
    }
    const allTimetableSlots = [];
    const staffAssignments = {};
    const freeSlotTracker = {};
    const subjectTracker = new Map();
    
    // Debug counters for tracking slot allocation
    const debugCounters = {
      totalProjectSubjects: 0,
      projectSlotsAllocated: 0,
      projectSlotAttempts: 0,
      failedAllocations: 0
    };
    
    // Track project subjects and their required slots
    const projectSubjectsAll = new Map(); // Map<subject_id, {required: number, allocated: number}>
    for (const [courseId, courseClasses] of Object.entries(classesByCourse)) {
      for (const cls of courseClasses) {
        const classKey = `${courseId}-${cls.class_id}`;
        freeSlotTracker[classKey] = {
          remainingFreeSlots: 5,
          freeSlotsPerDay: {},
          assignedDays: new Set()
        };
        const courseSubjects = await Subject.findAll({
          where: {
            course_id: courseId,
            semester: cls.semester,
            is_active: true
          },
          include: [{
            model: Staff,
            attributes: ['staff_id', 'staff_name'],
            required: false,
            where: { is_active: true }
          }]
        });

        // Debug log the subjects found
        console.log(`[DEBUG] Found subjects for course ${courseId}, semester ${cls.semester}:`,
          courseSubjects.map(s => ({
            id: s.subject_id,
            name: s.subject_name,
            category: s.subject_category,
            credits: s.theory_credits
          }))
        );

        const minorSubjectsInSemester = courseSubjects.filter(
          subject => ['minor(elective)', 'minor (elective)', 'elective'].includes(subject.subject_category?.toLowerCase())
        );
        const minorPairs = {};
        if (minorSubjectsInSemester.length > 1) {
          minorPairs[cls.semester] = minorSubjectsInSemester;
        }
        const subjectIds = courseSubjects.map(s => s.subject_id);
        const validAllocations = await Allocation.findAll({
          where: {
            subject_id: { [Op.in]: subjectIds },
            course_id: courseId,
            is_active: true
          }
        });
        for (const subject of courseSubjects) {
          const allocation = validAllocations.find(a => a.subject_id === subject.subject_id);
          const isProject = subject.subject_category?.toLowerCase().includes('project') || 
                            subject.subject_name?.toUpperCase().includes('PROJECT');
          const isMinorProject = isProject && subject.subject_category?.toLowerCase().includes('minor');
          const isMinorPaired = minorPairs[cls.semester]?.some(s => s.subject_id === subject.subject_id);
          const pairedWith = isMinorPaired ? minorPairs[cls.semester].find(s => s.subject_id !== subject.subject_id) : null;
          let totalTheoryCredits = subject.theory_credits;
          let maxDailySlotsAllowed = 2;

          if (isProject) {
            // Debug: Project subject configuration
            const debugConfig = {
              id: subject.subject_id,
              name: subject.subject_name,
              category: subject.subject_category,
              originalCredits: subject.theory_credits,
              isMinor: isMinorProject,
              isProjectConfirmed: subject.subject_category?.toLowerCase().includes('project') || 
                                subject.subject_name?.toUpperCase().includes('PROJECT')
            };
            console.log(`[DEBUG] Configuring project subject:`, debugConfig);

            // Handle project subjects - no staff allocation needed
            if (isMinorProject) {
              totalTheoryCredits = Math.max(4, subject.theory_credits); // Minimum 4 slots for minor projects
              maxDailySlotsAllowed = 2; // Allow up to 2 slots per day for minor projects
            } else {
              // Major projects get more slots
              totalTheoryCredits = Math.max(8, subject.theory_credits); // Minimum 8 slots for major projects
              maxDailySlotsAllowed = 3; // Allow up to 3 slots per day for major projects
            }
            // Clear any staff allocation for projects
            if (allocation) {
              allocation.staff_id = null;
              allocation.staff_name = null;
            }
            
            console.log(`Project configuration result:`, {
              totalTheoryCredits,
              maxDailySlotsAllowed,
              staff_id: allocation ? allocation.staff_id : null,
              staff_name: allocation ? allocation.staff_name : null
            });
            
            console.log(`Configuring Project:`, {
              name: subject.subject_name,
              type: isMinorProject ? 'Minor Project' : 'Major Project',
              credits: totalTheoryCredits,
              dailyLimit: maxDailySlotsAllowed
            });
          } else if (subject.subject_category?.toLowerCase().includes('minor')) {
            // For paired minors, share credits between the pair
            if (isMinorPaired && pairedWith) {
              // Total of 6 theory slots (3+3) shared between the pair
              // Divide by 2 to get 3 slots total shared between them
              totalTheoryCredits = 1.5;
              subject.lab_credits = 1; // One lab slot shared between pair
              maxDailySlotsAllowed = 1;
              
              console.log(`Initializing Minor Pair:`, {
                subject: subject.subject_name,
                pairedWith: pairedWith.subject_name,
                individualTheoryCredits: totalTheoryCredits,
                sharedLabSlots: 1,
                totalPairTheorySlots: 3,
                dailyLimit: 1
              });
            } else {
              totalTheoryCredits = 3;
              maxDailySlotsAllowed = 1;
            }
          } else if (subject.theory_credits >= 4) {
            maxDailySlotsAllowed = 2;
          }
          const key = `${subject.subject_id}-${cls.semester}`;
          const isProjectSubject = subject.subject_category?.toLowerCase().includes('project') || 
                      subject.subject_name?.toUpperCase().includes('PROJECT');

          // Debug log for project subjects
          if (isProjectSubject) {
            console.log(`[DEBUG] Adding project subject to tracker:`, {
              id: subject.subject_id,
              name: subject.subject_name,
              category: subject.subject_category,
              semester: cls.semester,
              class_id: cls.class_id,
              key: key
            });
          }

          subjectTracker.set(key, {
            id: subject.subject_id,
            name: subject.subject_name,
            theory_credits: totalTheoryCredits,
            lab_credits: subject.lab_credits,
            total_theory_credits: totalTheoryCredits,
            total_lab_credits: subject.lab_credits,
            required_slots_per_day: Math.min(maxDailySlotsAllowed, Math.ceil(totalTheoryCredits / days.length)),
            staff_id: allocation ? allocation.staff_id : null,
            staff_name: allocation ? allocation.staff_name : null,
            semester: cls.semester,
            class_id: cls.class_id,
            course_id: courseId,
            subject_category: subject.subject_category,
            maxDailySlotsAllowed,
            isMinorPaired,
            pairedSubject: pairedWith ? {
              id: pairedWith.subject_id,
              name: pairedWith.subject_name,
              staff_id: validAllocations.find(a => a.subject_id === pairedWith.subject_id)?.staff_id,
              staff_name: validAllocations.find(a => a.subject_id === pairedWith.subject_id)?.staff_name
            } : null,
            usedInDays: new Set(),
            labUsedInDays: new Set()
          });
        }
    // Initialize paired minor subject tracking
    const minorPairSlots = new Map(); // Track slots used by each minor pair

    for (const [dayIndex, dayName] of days.entries()) {
      staffAssignments[dayIndex] = staffAssignments[dayIndex] || {};
      const totalSlots = timeSlots.length;
      const labSlotsNeeded = Math.ceil((timeConfig.labDuration || 120) / (timeConfig.theoryDuration || 60));
      const theorySlotLimit = totalSlots - labSlotsNeeded;
      // First allocate theory slots for the first part of the day
      for (let slotIndex = 0; slotIndex < theorySlotLimit; slotIndex++) {
        const slot = timeSlots[slotIndex];
        if (slot.isLunch) {
          allTimetableSlots.push({
            school_id,
            department_id,
            course_id: courseId,
            class_id: cls.class_id,
            semester: cls.semester,
            day: dayIndex,
            start_time: slot.start,
            end_time: slot.end,
            slot_type: 'lunch',
            is_active: true
          });
          continue;
        }

        const classTracker = freeSlotTracker[classKey];
        classTracker.freeSlotsPerDay[dayIndex] = classTracker.freeSlotsPerDay[dayIndex] || 0;
        if (classTracker.remainingFreeSlots === undefined) {
          classTracker.remainingFreeSlots = 5;
        }

        // Check if there's already a free slot for this day
        const existingFreeSlotsForDay = allTimetableSlots.filter(slot => 
          slot.class_id === cls.class_id && 
          slot.day === dayIndex && 
          slot.slot_type === 'free'
        ).length;

        // Get available subjects that haven't been scheduled today
        const availableSubjects = getAvailableSubjects(
          subjectTracker,
          dayIndex,
          false,
          staffAssignments[dayIndex],
          slot,
          cls.semester,
          allTimetableSlots
        );

        const canAddFreeSlot = classTracker.remainingFreeSlots > 0 && 
                              existingFreeSlotsForDay === 0;

        // Randomly decide whether to add a free slot (20% chance if conditions are met)
        const shouldAddFreeSlot = canAddFreeSlot && Math.random() < 0.2;

        if (shouldAddFreeSlot) {
          // Add a free slot
          allTimetableSlots.push({
            school_id,
            department_id,
            course_id: courseId,
            class_id: cls.class_id,
            semester: cls.semester,
            day: dayIndex,
            start_time: slot.start,
            end_time: slot.end,
            slot_type: 'free',
            is_active: true
          });
          classTracker.remainingFreeSlots--;
          classTracker.freeSlotsPerDay[dayIndex]++;
          classTracker.assignedDays.add(dayIndex);
        } else if (availableSubjects.length > 0) {
          // Pick a random subject from availableSubjects to avoid clustering
          const randomIndex = Math.floor(Math.random() * availableSubjects.length);
          const subject = availableSubjects[randomIndex];

          // Handle theory slot allocation
          let weeklySlots = 0;
          if (subject.isMinorPaired && subject.pairedSubject) {
            // For paired minors, count slots allocated to both subjects combined
            const totalPairedTheorySlots = allTimetableSlots.filter(s =>
              s.subject_id === subject.id && s.slot_type === 'theory'
            ).length + allTimetableSlots.filter(s =>
              s.subject_id === subject.pairedSubject.id && s.slot_type === 'theory'
            ).length;
            weeklySlots = totalPairedTheorySlots;
          } else {
            weeklySlots = [...subject.usedInDays].length;
          }

          const maxTheorySlots = subject.isMinorPaired ? 3 : subject.total_theory_credits;
          if (weeklySlots < maxTheorySlots) {
            const slotToAdd = {
              school_id,
              department_id,
              course_id: courseId,
              class_id: cls.class_id,
              semester: subject.semester,
              subject_id: subject.id,
              subject_name: subject.name,
              staff_id: subject.staff_id,
              staff_name: subject.staff_name,
              day: dayIndex,
              start_time: slot.start,
              end_time: slot.end,
              slot_type: 'theory',
              subject_category: subject.subject_category,
              is_active: true
            };
            if (subject.staff_id) {
              const key = `${slot.start}-${slot.end}`;
              staffAssignments[dayIndex][key] = staffAssignments[dayIndex][key] || [];
              staffAssignments[dayIndex][key].push(subject.staff_id);
            }
            allTimetableSlots.push(slotToAdd);

            // If subject is a paired minor, merge with paired subject in one slot
            if (subject.isMinorPaired && subject.pairedSubject) {
              const pairedSubject = subject.pairedSubject;
              // Create standardized pair name to ensure consistent ordering
              const pairNames = [subject.name, pairedSubject.name].sort();
              const combinedSubjectName = `${pairNames[0]} / ${pairNames[1]}`;
              // Always combine both staff names with a separator
              const combinedStaffName = subject.staff_name && pairedSubject.staff_name ? 
                `${subject.staff_name} , ${pairedSubject.staff_name}` : 
                subject.staff_name || pairedSubject.staff_name;
              // Keep both staff IDs as an array
              const combinedStaffIds = [subject.staff_id, pairedSubject.staff_id].filter(id => id);

              // Modify the existing slotToAdd to represent both subjects
              slotToAdd.subject_name = combinedSubjectName;
              slotToAdd.subject_id = null; // Combined slot
              slotToAdd.staff_id = combinedStaffIds.join(','); // Store staff IDs as comma-separated string
              slotToAdd.staff_name = combinedStaffName;
              slotToAdd.subject_category = 'Minor(Elective)';

              // Update staff assignments for both staff if different
              if (subject.staff_id) {
                const key = `${slot.start}-${slot.end}`;
                staffAssignments[dayIndex][key] = staffAssignments[dayIndex][key] || [];
                staffAssignments[dayIndex][key].push(subject.staff_id);
              }
              if (pairedSubject.staff_id && pairedSubject.staff_id !== subject.staff_id) {
                const key = `${slot.start}-${slot.end}`;
                staffAssignments[dayIndex][key] = staffAssignments[dayIndex][key] || [];
                staffAssignments[dayIndex][key].push(pairedSubject.staff_id);
              }

              // Mark paired subject as used for this day
              if (subjectTracker.has(`${pairedSubject.id}-${pairedSubject.semester}`)) {
                const pairedSubjectEntry = subjectTracker.get(`${pairedSubject.id}-${pairedSubject.semester}`);
                pairedSubjectEntry.usedInDays.add(dayIndex);
                subjectTracker.set(`${pairedSubject.id}-${pairedSubject.semester}`, pairedSubjectEntry);
              }
            }
            
            // Mark this subject as used for this day
            if (subjectTracker.has(`${subject.id}-${subject.semester}`)) {
              const subjectEntry = subjectTracker.get(`${subject.id}-${subject.semester}`);
              subjectEntry.usedInDays.add(dayIndex);
              subjectTracker.set(`${subject.id}-${subject.semester}`, subjectEntry);
            }
          }
        } else {
          // Add an empty slot that can be filled later if needed
          allTimetableSlots.push({
            school_id,
            department_id,
            course_id: courseId,
            class_id: cls.class_id,
            semester: cls.semester,
            day: dayIndex,
            start_time: slot.start,
            end_time: slot.end,
            slot_type: 'free',
            is_active: true
          });
        }
      }
      // Now allocate lab slots at the end of the day
      const labSlots = [];
      const remainingSlots = timeSlots.slice(theorySlotLimit);
      
      if (remainingSlots.length >= 2) { // Ensure we have enough consecutive slots for a lab
        const labSlot = {
          start: remainingSlots[0].start,
          end: remainingSlots[remainingSlots.length - 1].end,
          duration: labSlotsNeeded * (timeConfig.theoryDuration || 60),
          slots: remainingSlots
        };
        labSlots.push(labSlot);
      }
      // Process lab slots
      for (const labSlot of labSlots) {
        const availableLabSubjects = getAvailableSubjects(
          subjectTracker,
          dayIndex,
          true,
          staffAssignments[dayIndex],
          labSlot,
          cls.semester,
          allTimetableSlots
        );
        // Sort lab subjects by remaining credits
        availableLabSubjects.sort((a, b) => {
          const aWeeklyLabs = [...(a.labUsedInDays || [])].length;
          const bWeeklyLabs = [...(b.labUsedInDays || [])].length;
          return (b.total_lab_credits - bWeeklyLabs) - (a.total_lab_credits - aWeeklyLabs);
        });
        for (const labSubject of availableLabSubjects) {
          let weeklyLabSlots = 0;
          if (labSubject.isMinorPaired && labSubject.pairedSubject) {
            // For paired minors, check lab slots for each subject individually
            const thisSubjectLabSlots = allTimetableSlots.filter(s =>
              s.subject_id === labSubject.id && s.slot_type === 'lab'
            ).length;
            
            const pairedSubjectLabSlots = allTimetableSlots.filter(s =>
              s.subject_id === labSubject.pairedSubject.id && s.slot_type === 'lab'
            ).length;
            
            console.log(`Minor Pair Lab Distribution:`, {
              subject: labSubject.name,
              subjectLabSlots: thisSubjectLabSlots,
              pairedWith: labSubject.pairedSubject.name,
              pairedLabSlots: pairedSubjectLabSlots,
              totalPairLabSlots: thisSubjectLabSlots + pairedSubjectLabSlots,
              maxSharedLabSlots: 1
            });
            
            // Use this subject's lab slots for checking
            weeklyLabSlots = thisSubjectLabSlots;
          } else {
            weeklyLabSlots = allTimetableSlots.filter(s =>
              s.subject_id === labSubject.id && s.slot_type === 'lab'
            ).length;
          }

          const dailyLabSlots = allTimetableSlots.filter(s => {
            if (labSubject.isMinorPaired && labSubject.pairedSubject) {
              // For paired minors, count lab slots for either subject in this day
              return (s.subject_id === labSubject.id || s.subject_id === labSubject.pairedSubject.id) && 
                     s.slot_type === 'lab' && s.day === dayIndex;
            }
            return s.subject_id === labSubject.id && s.slot_type === 'lab' && s.day === dayIndex;
          }).length;

          // For paired minors, check if either subject already has a lab slot
          if (labSubject.isMinorPaired && labSubject.pairedSubject) {
            // Create standardized pair name to ensure consistency
            const pairNames = [labSubject.name, labSubject.pairedSubject.name].sort();
            const standardPairName = `${pairNames[0]} / ${pairNames[1]}`;
            
            const totalPairLabSlots = allTimetableSlots.filter(s =>
              s.subject_name === standardPairName && s.slot_type === 'lab'
            ).length;

            console.log(`Checking Minor Pair Lab Slots:`, {
              subject: labSubject.name,
              pairedWith: labSubject.pairedSubject.name,
              existingPairLabSlots: totalPairLabSlots,
              maxAllowed: 1
            });

            // Skip if pair already has a lab slot
            if (totalPairLabSlots > 0) {
              console.log(`Skipping lab slot - Pair already has a lab slot`);
              continue;
            }
          }

          // Target lab credits is 1 for paired minors, otherwise use subject's total
          const targetLabCredits = (labSubject.isMinorPaired && labSubject.pairedSubject) ? 1 : labSubject.total_lab_credits;

          if (weeklyLabSlots < targetLabCredits && dailyLabSlots < 1) {
            // Check for staff conflicts (skip for project subjects)
            const isProject = labSubject.subject_category?.toLowerCase().includes('project') || 
                            labSubject.subject_name?.toUpperCase().includes('PROJECT');
            const hasConflict = !isProject && labSlot.slots.some(slot => {
              const timeKey = `${slot.start}-${slot.end}`;
              const assignedStaff = staffAssignments[dayIndex][timeKey] || [];
              return assignedStaff.includes(labSubject.staff_id);
            });
            if (!hasConflict) {
              const isProject = labSubject.subject_category?.toLowerCase().includes('project') || 
                              labSubject.subject_name?.toUpperCase().includes('PROJECT');

              const labSlotToAdd = {
                school_id,
                department_id,
                course_id: courseId,
                class_id: cls.class_id,
                semester: labSubject.semester,
                subject_id: labSubject.id,
                subject_name: labSubject.name,
                staff_id: isProject ? null : labSubject.staff_id,
                staff_name: isProject ? null : labSubject.staff_name,
                day: dayIndex,
                start_time: labSlot.start,
                end_time: labSlot.end,
                slot_type: 'lab',
                subject_category: labSubject.subject_category,
                is_active: true
              };
              // Mark slots as used by this staff
              labSlot.slots.forEach(slot => {
                const timeKey = `${slot.start}-${slot.end}`;
                staffAssignments[dayIndex][timeKey] = staffAssignments[dayIndex][timeKey] || [];
                if (labSubject.staff_id) {
                  staffAssignments[dayIndex][timeKey].push(labSubject.staff_id);
                }
              });
              allTimetableSlots.push(labSlotToAdd);
              console.log(`Added lab slot for subject ${labSubject.name} on day ${dayIndex} at ${labSlot.start}`);
              // Mark lab slot as used for this subject
              if (subjectTracker.has(`${labSubject.id}-${labSubject.semester}`)) {
                const subjectEntry = subjectTracker.get(`${labSubject.id}-${labSubject.semester}`);
                subjectEntry.labUsedInDays.add(dayIndex);
                subjectTracker.set(`${labSubject.id}-${labSubject.semester}`, subjectEntry);
              }
              // If this is a paired minor subject's lab slot, combine it with its pair
              if (labSubject.isMinorPaired && labSubject.pairedSubject) {
                const pairedSubject = labSubject.pairedSubject;
                // Create standardized pair name to ensure consistent ordering
                const pairNames = [labSubject.name, pairedSubject.name].sort();
                labSlotToAdd.subject_name = `${pairNames[0]} / ${pairNames[1]}`;
                labSlotToAdd.subject_id = null; // Combined slot
                // Always combine both staff names with a separator
                labSlotToAdd.staff_name = labSubject.staff_name && pairedSubject.staff_name ? 
                  `${labSubject.staff_name} , ${pairedSubject.staff_name}` : 
                  labSubject.staff_name || pairedSubject.staff_name;
                // Keep both staff IDs as comma-separated string
                const staffIds = [labSubject.staff_id, pairedSubject.staff_id].filter(id => id);
                labSlotToAdd.staff_id = staffIds.join(',');

                // Update staff assignments for both staff if different
                if (pairedSubject.staff_id && pairedSubject.staff_id !== labSubject.staff_id) {
                  labSlot.slots.forEach(slot => {
                    const timeKey = `${slot.start}-${slot.end}`;
                    staffAssignments[dayIndex][timeKey] = staffAssignments[dayIndex][timeKey] || [];
                    staffAssignments[dayIndex][timeKey].push(pairedSubject.staff_id);
                  });
                }

                // Mark paired subject's lab as used for this day
                if (subjectTracker.has(`${pairedSubject.id}-${pairedSubject.semester}`)) {
                  const pairedSubjectEntry = subjectTracker.get(`${pairedSubject.id}-${pairedSubject.semester}`);
                  pairedSubjectEntry.labUsedInDays.add(dayIndex);
                  subjectTracker.set(`${pairedSubject.id}-${pairedSubject.semester}`, pairedSubjectEntry);
                }
              }
              break;
            }
          }
        }
      }
    }
      }
    }
    // === PROJECT SLOT FILLING LOGIC START ===
    console.log('\n[DEBUG] Starting Project Slot Filling Phase');
    
    // For each class, handle project slots with priority
    for (const [courseId, courseClasses] of Object.entries(classesByCourse)) {
      for (const cls of courseClasses) {
        console.log(`\n[DEBUG] Processing class ${cls.class_id} in semester ${cls.semester}`);
        
        // Find all project subjects for this class
        console.log(`[DEBUG] Searching for project subjects in class ${cls.class_id}, semester ${cls.semester}`);

// Debug log all subjects for this class first
const allSubjects = Array.from(subjectTracker.values()).filter(s => s.class_id === cls.class_id);
console.log(`[DEBUG] All subjects for class ${cls.class_id}:`, 
  allSubjects.map(s => ({
    id: s.id,
    name: s.name,
    category: s.subject_category,
    class_id: s.class_id
  }))
);

const projectSubjects = Array.from(subjectTracker.values()).filter(s => {
  const isProject = s.class_id === cls.class_id && 
                   (s.subject_category?.toLowerCase().includes('project') || 
                    s.name?.toUpperCase().includes('PROJECT'));
  
  if (isProject) {
    console.log(`[DEBUG] Found project subject:`, {
      id: s.id,
      name: s.name,
      category: s.subject_category,
      class_id: s.class_id
    });
  }
  
  return isProject;
});

debugCounters.totalProjectSubjects += projectSubjects.length;
        
        console.log(`[DEBUG] Found ${projectSubjects.length} project subjects:`, 
          projectSubjects.map(p => ({
            name: p.name,
            category: p.subject_category,
            allocated: allTimetableSlots.filter(s => s.subject_id === p.id).length,
            requiredSlots: p.total_theory_credits
          })));

        // Sort projects by priority (major projects first)
        projectSubjects.sort((a, b) => {
          const isAMinor = a.subject_category?.toLowerCase().includes('minor');
          const isBMinor = b.subject_category?.toLowerCase().includes('minor');
          return isAMinor === isBMinor ? 0 : isAMinor ? 1 : -1;
        });

        for (const projectSubject of projectSubjects) {
          const isMinorProject = projectSubject.subject_category?.toLowerCase().includes('minor');
          
          // Count existing project slots
          const existingProjectSlots = allTimetableSlots.filter(
            s => s.subject_id === projectSubject.id && s.slot_type === 'theory'
          ).length;

          // Calculate how many more slots we need
          const targetSlots = isMinorProject ? 4 : 8; // Minimum slots for minor/major projects
          const neededSlots = Math.max(0, targetSlots - existingProjectSlots);

          if (neededSlots > 0) {
            console.log(`Allocating additional slots for project:`, {
              name: projectSubject.name,
              type: isMinorProject ? 'Minor Project' : 'Major Project',
              existing: existingProjectSlots,
              needed: neededSlots
            });

            // First try to convert free slots
            console.log(`[DEBUG] Looking for free slots for project: ${projectSubject.name}`);
            
            // Get all free slots and verify they exist
            const freeSlots = allTimetableSlots.filter(s => {
              const isFree = s.class_id === cls.class_id && s.slot_type === 'free';
              if (isFree) {
                console.log(`[DEBUG] Found free slot:`, {
                  day: s.day,
                  time: `${s.start_time}-${s.end_time}`,
                  slotType: s.slot_type
                });
              }
              return isFree;
            });

            console.log(`[DEBUG] Total free slots found: ${freeSlots.length}`);

            // Group free slots by day to ensure even distribution
            const freeSlotsByDay = freeSlots.reduce((acc, slot) => {
              acc[slot.day] = acc[slot.day] || [];
              acc[slot.day].push(slot);
              console.log(`[DEBUG] Adding free slot to day ${slot.day}, now has ${acc[slot.day].length} slots`);
              return acc;
            }, {});

            let slotsAdded = 0;
            const maxPerDay = isMinorProject ? 2 : 3;

            // Try to distribute project slots evenly across days
            for (const day of Object.keys(freeSlotsByDay)) {
              const daySlots = freeSlotsByDay[day];
              const existingDayProjectSlots = allTimetableSlots.filter(
                s => s.subject_id === projectSubject.id && 
                     s.slot_type === 'theory' && 
                     s.day === parseInt(day)
              ).length;

              const slotsToAddToday = Math.min(
                maxPerDay - existingDayProjectSlots,
                daySlots.length,
                neededSlots - slotsAdded
              );

              console.log(`[DEBUG] Attempting to add ${slotsToAddToday} project slots for day ${day}`);
              
              for (let i = 0; i < slotsToAddToday; i++) {
                debugCounters.projectSlotAttempts++;
                const slot = daySlots[i];
                
                if (!slot) {
                  console.log(`[DEBUG] No available slot at index ${i} for day ${day}`);
                  debugCounters.failedAllocations++;
                  continue;
                }
                
                const timeKey = `${slot.start_time}-${slot.end_time}`;
                const dayAssignments = staffAssignments[slot.day] || {};
                const assignedStaff = dayAssignments[timeKey] || [];

                if (!assignedStaff.includes(projectSubject.staff_id)) {
                  // Convert the free slot to a project slot and create a new slot object
                  const projectSlot = {
                    ...slot,
                    subject_id: projectSubject.id,
                    subject_name: projectSubject.name,
                    staff_id: null,
                    staff_name: null,
                    slot_type: 'theory',
                    subject_category: projectSubject.subject_category,
                    is_active: true
                  };
                  
                  // Find and replace the free slot in the allTimetableSlots array
                  const slotIndex = allTimetableSlots.findIndex(s => 
                    s.class_id === cls.class_id && 
                    s.slot_type === 'free' &&
                    s.day === parseInt(day) &&
                    s.start_time === slot.start_time &&
                    s.end_time === slot.end_time
                  );
                  
                  console.log(`[DEBUG] Attempting to replace slot at index ${slotIndex}`, {
                    original: slotIndex !== -1 ? {
                      type: allTimetableSlots[slotIndex].slot_type,
                      day: allTimetableSlots[slotIndex].day,
                      time: `${allTimetableSlots[slotIndex].start_time}-${allTimetableSlots[slotIndex].end_time}`
                    } : 'not found',
                    replacement: {
                      name: projectSlot.subject_name,
                      type: projectSlot.slot_type,
                      day: projectSlot.day,
                      time: `${projectSlot.start_time}-${projectSlot.end_time}`
                    }
                  });
                  
                  if (slotIndex !== -1) {
                    allTimetableSlots[slotIndex] = projectSlot;
                    debugCounters.projectSlotsAllocated++;
                    console.log(`[DEBUG] Successfully allocated project slot ${debugCounters.projectSlotsAllocated}`);
                  } else {
                    console.log(`[DEBUG] Failed to find matching free slot to replace`);
                    debugCounters.failedAllocations++;
                  }

                  // Update staff assignments
                  if (projectSubject.staff_id) {
                    staffAssignments[slot.day] = staffAssignments[slot.day] || {};
                    staffAssignments[slot.day][timeKey] = staffAssignments[slot.day][timeKey] || [];
                    staffAssignments[slot.day][timeKey].push(projectSubject.staff_id);
                  }

                  // Update project tracking
                  if (subjectTracker.has(`${projectSubject.id}-${projectSubject.semester}`)) {
                    const subjectEntry = subjectTracker.get(`${projectSubject.id}-${projectSubject.semester}`);
                    subjectEntry.usedInDays.add(slot.day);
                    subjectTracker.set(`${projectSubject.id}-${projectSubject.semester}`, subjectEntry);
                  }

                  slotsAdded++;
                }
              }

              if (slotsAdded >= neededSlots) break;
            }
          }
        }
      }
    }
    // === PROJECT SLOT FILLING LOGIC END ===
    
    // Debug summary and validation
    const finalProjectSlots = allTimetableSlots.filter(s => 
      s.subject_category?.toLowerCase().includes('project') || 
      s.subject_name?.toUpperCase().includes('PROJECT')
    );

    console.log('\n[DEBUG] Project Slot Allocation Summary:', {
      totalProjectSubjects: debugCounters.totalProjectSubjects,
      totalAttemptedAllocations: debugCounters.projectSlotAttempts,
      failedAllocations: debugCounters.failedAllocations,
      successfulAllocations: debugCounters.projectSlotAttempts - debugCounters.failedAllocations,
      actualProjectSlots: finalProjectSlots.length
    });

    // Validate project slot allocation
    const projectValidation = new Map();
    finalProjectSlots.forEach(slot => {
      const key = `${slot.subject_id}-${slot.class_id}`;
      if (!projectValidation.has(key)) {
        projectValidation.set(key, {
          name: slot.subject_name,
          slots: [],
          required: slot.subject_category?.toLowerCase().includes('minor') ? 4 : 8
        });
      }
      projectValidation.get(key).slots.push({
        day: slot.day,
        time: `${slot.start_time}-${slot.end_time}`
      });
    });

    console.log('\n[DEBUG] Project Allocation Validation:');
    projectValidation.forEach((data, key) => {
      console.log(`Project: ${data.name}`, {
        requiredSlots: data.required,
        actualSlots: data.slots.length,
        status: data.slots.length >= data.required ? 'OK' : 'INSUFFICIENT',
        distribution: data.slots
      });
    });

    console.log('\n[DEBUG] Final Project Slots:', 
      allTimetableSlots.filter(s => 
        s.subject_category?.toLowerCase().includes('project') || 
        s.subject_name?.toUpperCase().includes('PROJECT')
      ).map(s => ({
        name: s.subject_name,
        day: s.day,
        time: `${s.start_time}-${s.end_time}`,
        type: s.slot_type
      }))
    );

    // Post-processing: For each class and day, assign one random free slot if none exists
    for (const [courseId, courseClasses] of Object.entries(classesByCourse)) {
      for (const cls of courseClasses) {
        // Count free slots per day for this class
        const freeSlotsPerDay = {};
        for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
          freeSlotsPerDay[dayIndex] = 0;
        }
        allTimetableSlots.forEach(slot => {
          if (slot.class_id === cls.class_id && slot.slot_type === 'free') {
            freeSlotsPerDay[slot.day] = (freeSlotsPerDay[slot.day] || 0) + 1;
          }
        });

        // Move extra free slots from days with more than 1 to days with 0 free slots
        for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
          while (freeSlotsPerDay[dayIndex] > 1) {
            // Find a day with 0 free slots
            const targetDay = Object.keys(freeSlotsPerDay).find(d => freeSlotsPerDay[d] === 0);
            if (targetDay === undefined) break;

            // Find a free slot in current day to move
            const slotToMoveIndex = allTimetableSlots.findIndex(slot => 
              slot.class_id === cls.class_id && 
              slot.day === dayIndex && 
              slot.slot_type === 'free'
            );
            if (slotToMoveIndex === -1) break;

            // Move the slot to targetDay
            allTimetableSlots[slotToMoveIndex].day = parseInt(targetDay);
            freeSlotsPerDay[dayIndex]--;
            freeSlotsPerDay[targetDay]++;
          }
        }

        // Assign one random free slot if none exists on a day
        for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
          if (freeSlotsPerDay[dayIndex] === 0) {
            // Get all slots for this class and day
            const daySlots = allTimetableSlots.filter(slot => slot.class_id === cls.class_id && slot.day === dayIndex);
            // Find available slots that are not lunch and have no subject assigned (slot_type not theory/lab/free/lunch)
            const availableSlots = daySlots.filter(slot => 
              slot.slot_type !== 'lunch' && 
              slot.slot_type !== 'free' && 
              slot.slot_type !== 'theory' && 
              slot.slot_type !== 'lab'
            );
            if (availableSlots.length > 0) {
              // Pick one random slot to assign as free
              const randomIndex = Math.floor(Math.random() * availableSlots.length);
              const slotToFree = availableSlots[randomIndex];
              // Update slot_type to free and clear subject/staff info
              slotToFree.slot_type = 'free';
              slotToFree.subject_id = null;
              slotToFree.subject_name = 'Free';
              slotToFree.staff_id = null;
              slotToFree.staff_name = null;
              // Update the slot in allTimetableSlots array
              const slotIndex = allTimetableSlots.findIndex(s => s === slotToFree);
              if (slotIndex !== -1) {
                allTimetableSlots[slotIndex] = slotToFree;
              }
              freeSlotsPerDay[dayIndex]++;
            }
          }
        }
      }
    }    // Final DB write
    // Only delete timetables for the target semesters
    await Timetable.destroy({ 
      where: { 
        school_id, 
        department_id,
        semester: {
          [Op.in]: targetSemesters
        }
      } 
    });
    
    // Ensure each slot has a semester value
    const slotsWithSemester = allTimetableSlots.map(slot => ({
      ...slot,
      semester: slot.semester || (
        // If semester is missing, try to get it from the class
        classes.find(c => c.class_id === slot.class_id)?.semester
      )
    }));

    await Timetable.bulkCreate(slotsWithSemester);
    return res.status(200).json({ message: "Timetable generated successfully", data: slotsWithSemester });
  } catch (error) {
    console.error("Error generating timetable:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
// Main timetable generation helper function - removed duplicate declaration
// This code has been merged into the exported generateTimetable function above
// Get generated timetables
export const getGeneratedTimetables = async (req, res) => {
  try {
    const { department_id, school_id, semesterType } = req.query;
    console.log('Get Generated Timetables - Input:', { department_id, school_id, semesterType });

    // Define odd and even semesters
    const oddSemesters = [1, 3, 5, 7];
    const evenSemesters = [2, 4, 6, 8];
    const targetSemesters = semesterType === 'odd' ? oddSemesters : evenSemesters;

    console.log('Target semesters:', targetSemesters);

    const where = {
      department_id,
      school_id,
      is_active: true,
      semester: {
        [Op.in]: targetSemesters
      }
    };

    console.log('Query conditions:', where);

    const timetables = await Timetable.findAll({
      where,
      attributes: [
        'timetable_id', 'school_id', 'department_id', 'course_id', 'class_id',
        'subject_id', 'subject_name', 'staff_id', 'staff_name', 'day',
        'start_time', 'end_time', 'slot_type', 'semester', 'is_active'
      ],
      order: [
        ['day', 'ASC'],
        ['start_time', 'ASC']
      ]
    });

    // Add detailed logging
    console.log('Found timetables:', timetables.length);
    if (timetables.length > 0) {
      console.log('Sample timetable entries:', 
        timetables.slice(0, 3).map(t => ({
          semester: t.semester,
          subject: t.subject_name,
          day: t.day,
          time: `${t.start_time}-${t.end_time}`
        }))
      );
    }

    // Log unique semesters found
    const uniqueSemesters = [...new Set(timetables.map(t => t.semester))].sort();
    console.log('Unique semesters found:', uniqueSemesters);
    
    res.status(200).json(timetables);
  } catch (error) {
    console.error('Error in getGeneratedTimetables:', error);
    res.status(500).json({ 
      message: 'Failed to fetch generated timetables', 
      error: error.message,
      details: error.stack
    });
  }
};
// Get subjects
export const getSubjects = async (req, res) => {
  try {
    const { school_id, department_id } = req.query;
    console.log('Fetching subjects for school_id:', school_id, 'department_id:', department_id);
    if (!school_id || !department_id) {
      return res.status(400).json({ error: "School ID and Department ID are required" });
    }
    // Find all active courses for the department
    const courses = await Course.findAll({
      where: {
        school_id,
        department_id,
        is_active: true
      },
      attributes: ['course_id', 'course_name']
    });
    console.log('Found courses:', courses.map(c => ({ id: c.course_id, name: c.course_name })));
    if (!courses.length) {
      return res.status(404).json({
        error: "No active courses found for this department",
        school_id,
        department_id
      });
    }
    // Get course IDs
    const courseIds = courses.map(c => c.course_id);
    // Find all active subjects for these courses
    const subjects = await Subject.findAll({
      where: {
        course_id: { [Op.in]: courseIds },
        is_active: true
      },
      include: [
        {
          model: Course,
          where: {
            school_id,
            department_id,
            is_active: true
          },
          required: true,
          attributes: ['course_id', 'course_name', 'school_id', 'department_id']
        },
        {
          model: Staff,
          where: { is_active: true },
          required: false,
          attributes: ['staff_id', 'staff_name']
        }
      ],
      attributes: [
        'subject_id',
        'subject_name',
        'sub_type',
        'subject_category',
        'theory_credits',
        'lab_credits',
        'semester',
        'staff_id'
      ]
    });
    console.log(`Found ${subjects.length} subjects for ${courses.length} courses`);
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      error: "Error fetching subjects",
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// Get staff
export const getStaff = async (req, res) => {
  try {
    const { school_id, department_id } = req.query;
    const staff = await Staff.findAll({ where: { school_id, department_id, is_active: true } });
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff', error: error.message });
  }
};
// Get subjects details - new endpoint
export const getSubjectsDetails = async (req, res) => {
  try {
    const { subjectIds } = req.query;
    if (!subjectIds) {
      return res.status(400).json({
        success: false,
        error: "Subject IDs are required"
      });
    }
    const idArray = subjectIds.split(',').map(id => parseInt(id));
    console.log('Backend: Fetching subjects for IDs:', idArray);
    const subjects = await Subject.findAll({
      where: {
        subject_id: {
          [Op.in]: idArray
        },
        is_active: true
      },
      attributes: [
        'subject_id',
        'subject_name',
        'sub_type',
        'theory_credits',
        'lab_credits'
      ]
    });
    console.log('Backend: Found subjects:', subjects.map(s => ({
      id: s.subject_id,
      name: s.subject_name
    })));
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(subjects || []);
  } catch (error) {
    console.error('Backend: Error in getSubjectsDetails:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching subject details",
      message: error.message
    });
  }
};
