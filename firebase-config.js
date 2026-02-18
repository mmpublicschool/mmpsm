// ============================================
// FIREBASE CONFIGURATION - COMPLETE VERSION
// ============================================

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    set, 
    push, 
    update, 
    remove, 
    get, 
    child, 
    query, 
    orderByChild, 
    equalTo, 
    limitToLast,
    onValue,
    off 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { 
    getStorage, 
    ref as storageRef, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";
import { 
    getAnalytics, 
    logEvent 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyAHAQjn4sTuR9FiGF3ljRrFEMZQjsx-SHg",
    authDomain: "apni-duniya-b53d7.firebaseapp.com",
    databaseURL: "https://apni-duniya-b53d7-default-rtdb.firebaseio.com",
    projectId: "apni-duniya-b53d7",
    storageBucket: "apni-duniya-b53d7.firebasestorage.app",
    messagingSenderId: "178853058918",
    appId: "1:178853058918:web:91dfaa5c5e41446da290a7",
    measurementId: "G-SW5SH1V2BB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// ============================================
// ADMISSION SYSTEM FUNCTIONS
// ============================================

/**
 * Save admission data to Firebase
 * @param {Object} admissionData - Complete admission form data
 * @returns {Promise<boolean>} - Success status
 */
export async function saveAdmissionToFirebase(admissionData) {
    try {
        const admissionId = admissionData.admissionId;
        const timestamp = Date.now();
        
        // Add metadata
        const completeData = {
            ...admissionData,
            createdAt: timestamp,
            updatedAt: timestamp,
            createdDate: new Date(timestamp).toISOString(),
            status: admissionData.status || 'pending'
        };
        
        // Save to admissions node
        await set(ref(database, 'admissions/' + admissionId), completeData);
        
        // Update class-wise count for roll number generation
        const classRef = ref(database, 'classCounts/' + admissionData.classApplied);
        const classSnapshot = await get(classRef);
        const currentCount = classSnapshot.val() || 0;
        await set(classRef, currentCount + 1);
        
        // Log analytics event
        logEvent(analytics, 'admission_submitted', {
            class: admissionData.classApplied,
            admissionId: admissionId
        });
        
        console.log('✅ Admission saved successfully:', admissionId);
        return true;
    } catch (error) {
        console.error('❌ Firebase save error:', error);
        return false;
    }
}

/**
 * Get single admission by ID
 * @param {string} admissionId - Admission ID to fetch
 * @returns {Promise<Object|null>} - Admission data or null
 */
export async function getAdmissionById(admissionId) {
    try {
        const snapshot = await get(ref(database, 'admissions/' + admissionId));
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log('No admission found with ID:', admissionId);
            return null;
        }
    } catch (error) {
        console.error('❌ Firebase fetch error:', error);
        return null;
    }
}

/**
 * Get all admissions
 * @param {Object} options - Filter options (limit, status, class)
 * @returns {Promise<Object>} - Object of admissions
 */
export async function getAllAdmissions(options = {}) {
    try {
        let admissionsRef = ref(database, 'admissions');
        let snapshot;
        
        if (options.status && options.status !== 'all') {
            // Query by status
            const statusQuery = query(
                ref(database, 'admissions'), 
                orderByChild('status'), 
                equalTo(options.status)
            );
            snapshot = await get(statusQuery);
        } else if (options.class && options.class !== 'all') {
            // Query by class
            const classQuery = query(
                ref(database, 'admissions'), 
                orderByChild('classApplied'), 
                equalTo(options.class)
            );
            snapshot = await get(classQuery);
        } else {
            // Get all
            snapshot = await get(admissionsRef);
        }
        
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return {};
        }
    } catch (error) {
        console.error('❌ Firebase fetch error:', error);
        return {};
    }
}

/**
 * Get admissions with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} - Paginated admissions
 */
export async function getPaginatedAdmissions(page = 1, limit = 10) {
    try {
        const snapshot = await get(ref(database, 'admissions'));
        if (!snapshot.exists()) {
            return { data: {}, total: 0 };
        }
        
        const allData = snapshot.val();
        const entries = Object.entries(allData);
        
        // Sort by timestamp (newest first)
        entries.sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
        
        // Paginate
        const start = (page - 1) * limit;
        const paginatedEntries = entries.slice(start, start + limit);
        
        const paginatedData = {};
        paginatedEntries.forEach(([key, value]) => {
            paginatedData[key] = value;
        });
        
        return {
            data: paginatedData,
            total: entries.length,
            page: page,
            totalPages: Math.ceil(entries.length / limit)
        };
    } catch (error) {
        console.error('❌ Firebase pagination error:', error);
        return { data: {}, total: 0, page: 1, totalPages: 0 };
    }
}

/**
 * Update admission status
 * @param {string} admissionId - Admission ID
 * @param {string} status - New status (pending/approved/rejected)
 * @param {string} remarks - Optional remarks
 * @returns {Promise<boolean>} - Success status
 */
export async function updateAdmissionStatus(admissionId, status, remarks = '') {
    try {
        const updates = {
            status: status,
            updatedAt: Date.now(),
            lastUpdateDate: new Date().toISOString()
        };
        
        if (remarks) {
            updates.remarks = remarks;
        }
        
        await update(ref(database, 'admissions/' + admissionId), updates);
        
        // Log analytics event
        logEvent(analytics, 'admission_status_updated', {
            admissionId: admissionId,
            newStatus: status
        });
        
        console.log('✅ Status updated for:', admissionId);
        return true;
    } catch (error) {
        console.error('❌ Status update error:', error);
        return false;
    }
}

/**
 * Delete admission
 * @param {string} admissionId - Admission ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteAdmission(admissionId) {
    try {
        await remove(ref(database, 'admissions/' + admissionId));
        console.log('✅ Admission deleted:', admissionId);
        return true;
    } catch (error) {
        console.error('❌ Delete error:', error);
        return false;
    }
}

/**
 * Search admissions by field
 * @param {string} searchTerm - Search term
 * @param {string} field - Field to search (name, admissionId, mobile)
 * @returns {Promise<Object>} - Matching admissions
 */
export async function searchAdmissions(searchTerm, field = 'name') {
    try {
        const snapshot = await get(ref(database, 'admissions'));
        if (!snapshot.exists()) {
            return {};
        }
        
        const allData = snapshot.val();
        const results = {};
        
        Object.entries(allData).forEach(([key, value]) => {
            const fieldValue = value[field] || '';
            if (fieldValue.toLowerCase().includes(searchTerm.toLowerCase())) {
                results[key] = value;
            }
        });
        
        return results;
    } catch (error) {
        console.error('❌ Search error:', error);
        return {};
    }
}

/**
 * Get admissions by class
 * @param {string} className - Class name
 * @returns {Promise<Object>} - Admissions in that class
 */
export async function getAdmissionsByClass(className) {
    try {
        const classQuery = query(
            ref(database, 'admissions'), 
            orderByChild('classApplied'), 
            equalTo(className)
        );
        const snapshot = await get(classQuery);
        return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
        console.error('❌ Class filter error:', error);
        return {};
    }
}

/**
 * Get admissions by status
 * @param {string} status - Status (pending/approved/rejected)
 * @returns {Promise<Object>} - Admissions with that status
 */
export async function getAdmissionsByStatus(status) {
    try {
        const statusQuery = query(
            ref(database, 'admissions'), 
            orderByChild('status'), 
            equalTo(status)
        );
        const snapshot = await get(statusQuery);
        return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
        console.error('❌ Status filter error:', error);
        return {};
    }
}

/**
 * Get recent admissions
 * @param {number} limit - Number of recent admissions
 * @returns {Promise<Object>} - Recent admissions
 */
export async function getRecentAdmissions(limit = 10) {
    try {
        const recentQuery = query(
            ref(database, 'admissions'), 
            orderByChild('createdAt'), 
            limitToLast(limit)
        );
        const snapshot = await get(recentQuery);
        return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
        console.error('❌ Recent fetch error:', error);
        return {};
    }
}

/**
 * Get statistics
 * @returns {Promise<Object>} - Statistics object
 */
export async function getAdmissionStats() {
    try {
        const snapshot = await get(ref(database, 'admissions'));
        if (!snapshot.exists()) {
            return {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                byClass: {}
            };
        }
        
        const allData = snapshot.val();
        let pending = 0, approved = 0, rejected = 0;
        const byClass = {};
        
        Object.values(allData).forEach(admission => {
            // Count by status
            if (admission.status === 'pending') pending++;
            else if (admission.status === 'approved') approved++;
            else if (admission.status === 'rejected') rejected++;
            
            // Count by class
            const className = admission.classApplied || 'unknown';
            byClass[className] = (byClass[className] || 0) + 1;
        });
        
        return {
            total: Object.keys(allData).length,
            pending: pending,
            approved: approved,
            rejected: rejected,
            byClass: byClass
        };
    } catch (error) {
        console.error('❌ Stats error:', error);
        return {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            byClass: {}
        };
    }
}

// ============================================
// STORAGE FUNCTIONS (CLOUDINARY ALTERNATIVE)
// ============================================

/**
 * Upload file to Firebase Storage
 * @param {File} file - File to upload
 * @param {string} path - Storage path
 * @returns {Promise<string|null>} - Download URL or null
 */
export async function uploadFileToStorage(file, path) {
    try {
        const storageReference = storageRef(storage, path + '/' + Date.now() + '_' + file.name);
        const snapshot = await uploadBytes(storageReference, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('❌ Storage upload error:', error);
        return null;
    }
}

/**
 * Delete file from Firebase Storage
 * @param {string} url - File URL to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFileFromStorage(url) {
    try {
        const fileRef = storageRef(storage, url);
        await deleteObject(fileRef);
        return true;
    } catch (error) {
        console.error('❌ Storage delete error:', error);
        return false;
    }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to real-time updates for all admissions
 * @param {Function} callback - Function to call when data changes
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToAdmissions(callback) {
    const admissionsRef = ref(database, 'admissions');
    
    const handleData = (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback({});
        }
    };
    
    onValue(admissionsRef, handleData);
    
    // Return unsubscribe function
    return () => off(admissionsRef);
}

/**
 * Subscribe to specific admission
 * @param {string} admissionId - Admission ID
 * @param {Function} callback - Function to call when data changes
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToAdmission(admissionId, callback) {
    const admissionRef = ref(database, 'admissions/' + admissionId);
    
    const handleData = (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    };
    
    onValue(admissionRef, handleData);
    
    // Return unsubscribe function
    return () => off(admissionRef);
}

// ============================================
// CLASS COUNTER FUNCTIONS
// ============================================

/**
 * Get current count for a class
 * @param {string} className - Class name
 * @returns {Promise<number>} - Current count
 */
export async function getClassCount(className) {
    try {
        const snapshot = await get(ref(database, 'classCounts/' + className));
        return snapshot.val() || 0;
    } catch (error) {
        console.error('❌ Class count error:', error);
        return 0;
    }
}

/**
 * Generate next roll number for class
 * @param {string} className - Class name
 * @returns {Promise<string>} - Generated roll number
 */
export async function generateRollNumber(className) {
    try {
        const count = await getClassCount(className);
        const nextNumber = count + 1;
        
        // Class code mapping
        const classCodes = {
            'Nursery': '01', 'LKG': '02', 'UKG': '03', '1': '04', '2': '05', 
            '3': '06', '4': '07', '5': '08', '6': '09', '7': '10',
            '8': '11', '9': '12', '10': '13', '11': '14', '12': '15'
        };
        
        const year = new Date().getFullYear().toString().slice(-2);
        const classCode = classCodes[className] || '00';
        const sequential = nextNumber.toString().padStart(3, '0');
        
        return `${year}${classCode}${sequential}`;
    } catch (error) {
        console.error('❌ Roll number generation error:', error);
        return '000000';
    }
}

// ============================================
// ID GENERATION FUNCTIONS
// ============================================

/**
 * Generate unique admission ID
 * @returns {string} - Generated admission ID
 */
export function generateAdmissionId() {
    const prefix = 'ADM';
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `${prefix}${year}${random}`;
}

/**
 * Generate unique ID (13 digit)
 * @returns {string} - Generated unique ID
 */
export function generateUniqueId() {
    const prefix = 'MMPSM';
    const random = Math.floor(Math.random() * 10000000000000);
    return `${prefix}${random.toString().padStart(13, '0')}`;
}

/**
 * Generate registration number
 * @param {string} uniqueId - Unique ID
 * @returns {string} - Generated registration number
 */
export function generateRegistrationNo(uniqueId) {
    const year = new Date().getFullYear();
    const last4 = uniqueId.slice(-4);
    const random = Math.floor(Math.random() * 900 + 100);
    return `R-${year}-${last4}-${random}`;
}

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
export {
    app,
    database,
    storage,
    analytics
};

// Default export for convenience
export default {
    // Core
    saveAdmissionToFirebase,
    getAdmissionById,
    getAllAdmissions,
    getPaginatedAdmissions,
    
    // Updates
    updateAdmissionStatus,
    deleteAdmission,
    
    // Search & Filters
    searchAdmissions,
    getAdmissionsByClass,
    getAdmissionsByStatus,
    getRecentAdmissions,
    getAdmissionStats,
    
    // Storage
    uploadFileToStorage,
    deleteFileFromStorage,
    
    // Real-time
    subscribeToAdmissions,
    subscribeToAdmission,
    
    // Class counters
    getClassCount,
    generateRollNumber,
    
    // ID Generation
    generateAdmissionId,
    generateUniqueId,
    generateRegistrationNo,
    
    // Firebase instances
    app,
    database,
    storage,
    analytics
};