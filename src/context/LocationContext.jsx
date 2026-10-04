import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { backendEnabled, fetchSchoolsFromBackend } from '../utils/api';

const FALLBACK_SCHOOLS = [
  {
    id: "SCH-001",
    name: "Delhi Public School, R.K. Puram",
    shortName: "Delhi Public School",
    board: "CBSE",
    city: "New Delhi",
    district: "New Delhi",
    subdistrict: "RK Puram",
    address: "Sector 12, R.K. Puram, New Delhi",
    pincode: "110022",
    lat: 28.5684,
    lng: 77.1834,
    classes: ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    studentCount: 4200,
    contactPerson: "Mrs. Sunita Chawla",
    email: "admin@dpsrkp.net",
    phone: "+91 11 2617 1267",
    status: "Partner Active",
    partnerSince: "2024",
    commissionShare: "5%",
    exclusiveKit: true
  },
  {
    id: "SCH-002",
    name: "The Mother’s International School",
    shortName: "The Mother’s International School",
    board: "CBSE",
    city: "New Delhi",
    district: "New Delhi",
    subdistrict: "Vijay Mandal",
    address: "Sri Aurobindo Marg, Vijay Mandal Enclave, New Delhi",
    pincode: "110016",
    lat: 28.5398,
    lng: 77.1994,
    classes: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    studentCount: 2600,
    contactPerson: "Dr. Arvind Menon",
    email: "principal@mis.org.in",
    phone: "+91 11 2652 4810",
    status: "Partner Active",
    partnerSince: "2023",
    commissionShare: "6%",
    exclusiveKit: true
  },
  {
    id: "SCH-003",
    name: "St. Xavier Senior Secondary School",
    shortName: "St. Xavier Senior Secondary",
    board: "ICSE",
    city: "Gurugram",
    district: "Gurugram",
    subdistrict: "Sector 14",
    address: "Sector 49, Rosewood City, Gurugram, Haryana",
    pincode: "122018",
    lat: 28.4195,
    lng: 77.0566,
    classes: ["LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    studentCount: 3100,
    contactPerson: "Fr. Matthew D’Souza",
    email: "contact@stxaviersgurugram.in",
    phone: "+91 124 405 9182",
    status: "Partner Active",
    partnerSince: "2024",
    commissionShare: "5%",
    exclusiveKit: false
  },
  {
    id: "SCH-004",
    name: "Kendriya Vidyalaya No. 1",
    shortName: "Kendriya Vidyalaya",
    board: "CBSE",
    city: "Pune",
    district: "Pune",
    subdistrict: "Ganeshkhind",
    address: "Ganeshkhind Road, Armament Colony, Pune, Maharashtra",
    pincode: "411007",
    lat: 18.5402,
    lng: 73.8340,
    classes: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    studentCount: 1850,
    contactPerson: "Mr. Satish Waghmare",
    email: "kv1pune@kvsedu.gov.in",
    phone: "+91 20 2634 1190",
    status: "Partner Active",
    partnerSince: "2025",
    commissionShare: "3%",
    exclusiveKit: true
  },
  {
    id: "SCH-005",
    name: "Modern School, Barakhamba Road",
    shortName: "Modern School, Barakhamba",
    board: "CBSE",
    city: "New Delhi",
    district: "New Delhi",
    subdistrict: "Central Delhi",
    address: "Barakhamba Road, Connaught Place, New Delhi",
    pincode: "110001",
    lat: 28.6304,
    lng: 77.2285,
    classes: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    studentCount: 2900,
    contactPerson: "Col. Rajesh Verma",
    email: "admin@modernschool.net",
    phone: "+91 11 2331 1618",
    status: "Partner Active",
    partnerSince: "2026",
    commissionShare: "5%",
    exclusiveKit: false
  },
  {
    id: "SCH-006",
    name: "Ryan International School",
    shortName: "Ryan International",
    board: "CBSE",
    city: "New Delhi",
    district: "New Delhi",
    subdistrict: "Mayur Vihar",
    address: "Mayur Vihar Phase 3, Delhi NCR",
    pincode: "110096",
    lat: 28.6094,
    lng: 77.2982,
    classes: ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    studentCount: 3400,
    contactPerson: "Mrs. Kavita Saxena",
    email: "info@ryanmayurvihar.edu",
    phone: "+91 11 2261 4455",
    status: "Partner Active",
    partnerSince: "2024",
    commissionShare: "5%",
    exclusiveKit: true
  }
];

export const DEFAULT_SCHOOLS = FALLBACK_SCHOOLS;

// Standard known cities and subdistrict localities with coordinates
export const POPULAR_CITIES = [
  { id: 'kamta_lucknow', name: 'Kamta, Lucknow', subdistrict: 'Kamta', city: 'Lucknow', lat: 26.8790, lng: 81.0118, state: 'Uttar Pradesh' },
  { id: 'jajmau_kanpur', name: 'Jajmau, Kanpur', subdistrict: 'Jajmau', city: 'Kanpur', lat: 26.4312, lng: 80.4026, state: 'Uttar Pradesh' },
  { id: 'rto_azamgarh', name: 'RTO, Azamgarh', subdistrict: 'RTO Area', city: 'Azamgarh', lat: 26.0682, lng: 83.1844, state: 'Uttar Pradesh' },
  { id: 'sec14_gurugram', name: 'Sector 14, Gurugram', subdistrict: 'Sector 14', city: 'Gurugram', lat: 28.4732, lng: 77.0425, state: 'Haryana' },
  { id: 'rk_puram_delhi', name: 'RK Puram, New Delhi', subdistrict: 'RK Puram', city: 'New Delhi', lat: 28.5684, lng: 77.1834, state: 'Delhi' },
  { id: 'delhi', name: 'Delhi NCR (Central)', subdistrict: 'Central Delhi', city: 'New Delhi', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { id: 'pune', name: 'Pune City', subdistrict: 'Ganeshkhind', city: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  { id: 'mumbai', name: 'Mumbai Metro', subdistrict: 'Bandra', city: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  { id: 'bengaluru', name: 'Bengaluru / Bangalore', subdistrict: 'Indiranagar', city: 'Bengaluru', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
];

/**
 * Calculates Great-Circle distance in kilometers using the Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

/**
 * Finds the nearest subdistrict locality from known POPULAR_CITIES or formats coordinates
 */
export function findNearestSubdistrict(lat, lng) {
  if (!lat || !lng) return 'Kamta, Lucknow';

  let closest = null;
  let minDistance = Infinity;

  for (const loc of POPULAR_CITIES) {
    const dist = calculateDistanceKm(lat, lng, loc.lat, loc.lng);
    if (dist !== null && dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  if (closest && minDistance < 50) {
    return closest.name;
  }
  return `Locality (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

export function parseLocationDetails(data = {}) {
  const addr = data.address || {};
  const displayName = data.display_name || '';

  const street = addr.road || addr.building || addr.amenity || (addr.house_number ? `${addr.house_number}, ${addr.road || ''}` : '');
  const colony = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || addr.city_district || addr.village || addr.hamlet || '';
  const landmark = addr.amenity || addr.landmark || addr.commercial || addr.historic || addr.shop || '';
  const city = addr.city || addr.town || addr.city_district || addr.district || addr.county || addr.state_district || 'Lucknow';

  let state = addr.state || addr.state_district || addr.region || addr.province || '';
  if (!state && displayName) {
    const matchedState = INDIAN_STATES.find((s) => new RegExp(`\\b${s}\\b`, 'i').test(displayName));
    if (matchedState) state = matchedState;
  }
  if (!state) state = 'Uttar Pradesh';

  let pincode = addr.postcode || addr.postal_code || addr.zip || addr.zipcode || '';
  if (!pincode && displayName) {
    const pinMatch = displayName.match(/\b[1-9][0-9]{5}\b/);
    if (pinMatch) pincode = pinMatch[0];
  }

  return {
    street,
    colony,
    landmark,
    city,
    state,
    pincode,
    displayName
  };
}

/**
 * Reverse geocodes live GPS coordinates into subdistrict / locality name using Nominatim with fallback
 */
export async function resolveSubdistrictFromCoords(lat, lng) {
  if (!lat || !lng) return 'Kamta, Lucknow';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      const parsed = parseLocationDetails(data);
      if (parsed.state) localStorage.setItem('bv_user_state', parsed.state);
      if (parsed.pincode) localStorage.setItem('bv_user_pincode', parsed.pincode);

      if (parsed.colony && parsed.city) {
        return `${parsed.colony}, ${parsed.city}`;
      } else if (parsed.colony) {
        return parsed.colony;
      } else if (parsed.city) {
        return parsed.city;
      }
    }
  } catch (e) {
    console.warn('Live reverse geocoding fallback to nearest subdistrict:', e);
  }
  return findNearestSubdistrict(lat, lng);
}

/**
 * Looks up city, state, district, and locality details for a 6-digit Indian PIN Code
 */
export async function fetchDetailsFromPincode(pincode) {
  if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) return null;
  const pin = String(pincode).trim();

  // Primary API: Official India Post Postal Pincode API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (
        Array.isArray(data) &&
        data[0]?.Status === 'Success' &&
        Array.isArray(data[0]?.PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const po = data[0].PostOffice[0];
        const state = po.State || '';
        const city = po.District || po.Division || po.Circle || '';
        const locality = po.Name && po.Name !== po.District ? po.Name : '';

        return {
          pincode: pin,
          state,
          city,
          district: po.District || city,
          locality,
          areaName: po.Name || ''
        };
      }
    }
  } catch (err) {
    console.warn('India Post Pincode API lookup failed, trying fallback:', err);
  }

  // Fallback API: OpenStreetMap Nominatim Postal Search
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        const parsed = parseLocationDetails(list[0]);
        return {
          pincode: pin,
          state: parsed.state,
          city: parsed.city,
          district: parsed.city,
          locality: parsed.colony || parsed.street || '',
          areaName: parsed.colony || ''
        };
      }
    }
  } catch (err) {
    console.warn('Nominatim pincode lookup failed:', err);
  }

  return null;
}

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  // 1. Admin-controlled discovery radius (km)
  const [schoolRadiusKm, setSchoolRadiusKm] = useState(() => {
    try {
      const stored = localStorage.getItem('bv_school_radius_km');
      if (stored) return Number(stored);
    } catch {}
    return 25; // default 25 km
  });

  // 2. Schools list (synced or fallback to mockData)
  const [schools, setSchools] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_schools');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SCHOOLS;
  });

  useEffect(() => {
    if (backendEnabled && typeof fetchSchoolsFromBackend === 'function') {
      fetchSchoolsFromBackend()
        .then((res) => {
          const list = res?.schools || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setSchools(list);
          }
        })
        .catch(() => {});
    }
  }, []);

  // 3. User Location state
  // Permission state: 'prompt' | 'granted' | 'denied' | 'manual'
  const [permissionStatus, setPermissionStatus] = useState(() => {
    try {
      return localStorage.getItem('bv_location_permission') || 'prompt';
    } catch {
      return 'prompt';
    }
  });

  // User coordinates: { lat, lng } or null
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_user_coords');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { lat: 26.8790, lng: 81.0118, label: 'Kamta, Lucknow' };
  });

  const [locationLabel, setLocationLabel] = useState(() => {
    try {
      return localStorage.getItem('bv_user_location_label') || 'Kamta, Lucknow';
    } catch {
      return 'Kamta, Lucknow';
    }
  });

  const [userSubdistrict, setUserSubdistrict] = useState(() => {
    try {
      return localStorage.getItem('bv_user_subdistrict') || 'Kamta, Lucknow';
    } catch {
      return 'Kamta, Lucknow';
    }
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);



  // Silent background location fetcher
  const fetchLocationInBackground = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = { lat, lng, accuracy: position.coords.accuracy };
        setUserLocation(coords);
        setPermissionStatus('granted');

        try {
          localStorage.setItem('bv_user_coords', JSON.stringify(coords));
          localStorage.setItem('bv_location_permission', 'granted');
          localStorage.setItem('bv_location_prompted_once', 'true');
        } catch {}

        // Resolve reverse geocoding in background
        try {
          const resolvedLabel = await resolveSubdistrictFromCoords(lat, lng);
          setUserSubdistrict(resolvedLabel);
          setLocationLabel(resolvedLabel);
          localStorage.setItem('bv_user_location_label', resolvedLabel);
          localStorage.setItem('bv_user_subdistrict', resolvedLabel);
        } catch {}
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  }, []);

  // Check initial permission status & navigator.permissions API
  useEffect(() => {
    let isMounted = true;

    const checkPermissionAndStartBg = async () => {
      const storedPermission = localStorage.getItem('bv_location_permission');
      const hasPrompted = localStorage.getItem('bv_location_prompted_once');

      // Check native browser permissions if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (!isMounted) return;

          if (status.state === 'granted') {
            setPermissionStatus('granted');
            setIsPermissionModalOpen(false); // Hide popup
            fetchLocationInBackground(); // Run in background

            status.onchange = () => {
              if (status.state === 'granted') {
                setPermissionStatus('granted');
                setIsPermissionModalOpen(false);
                fetchLocationInBackground();
              }
            };
            return;
          } else if (status.state === 'denied') {
            setPermissionStatus('denied');
          }
        } catch (err) {
          console.warn('Permissions API check failed:', err);
        }
      }

      // If stored as granted or manual, hide popup and run background sync if granted
      if (storedPermission === 'granted') {
        setPermissionStatus('granted');
        setIsPermissionModalOpen(false);
        fetchLocationInBackground();
      } else if (storedPermission === 'manual' || hasPrompted === 'true') {
        setIsPermissionModalOpen(false);
      } else if (!hasPrompted || permissionStatus === 'prompt') {
        // Show modal only if user has never been prompted
        const timer = setTimeout(() => {
          if (isMounted) setIsPermissionModalOpen(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    };

    checkPermissionAndStartBg();

    return () => {
      isMounted = false;
    };
  }, [fetchLocationInBackground, permissionStatus]);

  // Request native browser GPS permission
  const requestBrowserLocation = useCallback(() => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // ON ALLOW: IMMEDIATELY HIDE POPUP & RUN REST IN BACKGROUND
        setIsPermissionModalOpen(false);
        setPermissionStatus('granted');

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = {
          lat,
          lng,
          accuracy: position.coords.accuracy
        };
        setUserLocation(coords);

        try {
          localStorage.setItem('bv_user_coords', JSON.stringify(coords));
          localStorage.setItem('bv_location_permission', 'granted');
          localStorage.setItem('bv_location_prompted_once', 'true');
        } catch {}

        // Resolve reverse geocoding asynchronously in background without blocking UI
        resolveSubdistrictFromCoords(lat, lng)
          .then((resolvedLabel) => {
            setUserSubdistrict(resolvedLabel);
            setLocationLabel(resolvedLabel);
            setIsLocating(false);
            try {
              localStorage.setItem('bv_user_location_label', resolvedLabel);
              localStorage.setItem('bv_user_subdistrict', resolvedLabel);
            } catch {}
          })
          .catch(() => {
            setIsLocating(false);
          });
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. You can select your city manually.';
          setPermissionStatus('denied');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please try selecting your city.';
        }
        setLocationError(errorMsg);
        try {
          localStorage.setItem('bv_location_permission', 'denied');
          localStorage.setItem('bv_location_prompted_once', 'true');
        } catch {}
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  // Set manual city location
  const selectManualCity = useCallback((cityObj) => {
    const coords = {
      lat: cityObj.lat,
      lng: cityObj.lng,
      label: cityObj.name
    };
    const subdistrictLabel = cityObj.subdistrict ? `${cityObj.subdistrict}, ${cityObj.city}` : cityObj.name;
    setUserLocation(coords);
    setLocationLabel(subdistrictLabel);
    setUserSubdistrict(subdistrictLabel);
    setPermissionStatus('manual');
    setLocationError(null);
    setIsPermissionModalOpen(false);

    try {
      localStorage.setItem('bv_user_coords', JSON.stringify(coords));
      localStorage.setItem('bv_user_location_label', subdistrictLabel);
      localStorage.setItem('bv_user_subdistrict', subdistrictLabel);
      localStorage.setItem('bv_location_permission', 'manual');
      localStorage.setItem('bv_location_prompted_once', 'true');
    } catch {}
  }, []);

  // Calculate distance from user to any coordinates
  const getDistanceToCoords = useCallback((targetLat, targetLng) => {
    if (!userLocation?.lat || !userLocation?.lng) return null;
    return calculateDistanceKm(userLocation.lat, userLocation.lng, targetLat, targetLng);
  }, [userLocation]);

  // Enriched schools with calculated distance
  const schoolsWithDistance = useMemo(() => {
    return schools.map((school) => {
      const distanceKm = (userLocation?.lat && userLocation?.lng && school.lat && school.lng)
        ? calculateDistanceKm(userLocation.lat, userLocation.lng, school.lat, school.lng)
        : null;

      const isWithin = distanceKm !== null ? distanceKm <= schoolRadiusKm : true;

      return {
        ...school,
        distanceKm,
        isWithinRadius: isWithin
      };
    });
  }, [schools, userLocation, schoolRadiusKm]);

  // Filtered strictly to schools within the admin discovery radius
  const nearbySchools = useMemo(() => {
    return schoolsWithDistance
      .filter((s) => s.isWithinRadius)
      .sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [schoolsWithDistance]);

  // Top 10 Recommended Schools sorted by distance
  const top10Schools = useMemo(() => {
    return [...schoolsWithDistance]
      .sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, 10);
  }, [schoolsWithDistance]);

  // Check if a school (by full name or shortName) is within the radius
  const isSchoolWithinRadius = useCallback((schoolName) => {
    if (!schoolName) return true;
    const normalized = schoolName.toLowerCase().trim();
    if (normalized === 'any school' || normalized === 'standard catalog') return true;

    const matchedSchool = schoolsWithDistance.find((s) => {
      const sName = (s.name || '').toLowerCase();
      const sShort = (s.shortName || '').toLowerCase();
      return (
        sName.includes(normalized) ||
        normalized.includes(sName) ||
        sShort.includes(normalized) ||
        normalized.includes(sShort)
      );
    });

    if (!matchedSchool) return true; // Default to permissible if not in directory
    return matchedSchool.isWithinRadius;
  }, [schoolsWithDistance]);

  const value = {
    schoolRadiusKm,
    userLocation,
    locationLabel,
    userSubdistrict,
    permissionStatus,
    isLocating,
    locationError,
    isPermissionModalOpen,
    setIsPermissionModalOpen,
    requestBrowserLocation,
    selectManualCity,
    getDistanceToCoords,
    schools: schoolsWithDistance,
    nearbySchools,
    top10Schools,
    isSchoolWithinRadius,
    allSchoolsCount: schools.length,
    nearbySchoolsCount: nearbySchools.length
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    console.warn('useLocation was invoked outside a LocationProvider or during context initialization. Returning safe fallback context.');
    return {
      schoolRadiusKm: 25,
      userLocation: { lat: 26.8790, lng: 81.0118, label: 'Kamta, Lucknow' },
      locationLabel: 'Kamta, Lucknow',
      userSubdistrict: 'Kamta, Lucknow',
      permissionStatus: 'prompt',
      isLocating: false,
      locationError: null,
      isPermissionModalOpen: false,
      setIsPermissionModalOpen: () => {},
      requestBrowserLocation: () => {},
      selectManualCity: () => {},
      getDistanceToCoords: () => null,
      schools: [],
      nearbySchools: [],
      top10Schools: [],
      isSchoolWithinRadius: () => true,
      allSchoolsCount: 0,
      nearbySchoolsCount: 0
    };
  }
  return context;
}
