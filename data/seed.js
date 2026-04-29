// Run with: node data/seed.js
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'db.json')

let existing = { voters: [], elections: [], votes: [] }
if (fs.existsSync(DB_PATH)) {
    existing = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

const elections = [
    {
        id: randomUUID(),
        title: 'SUG President',
        description: 'Election for the Student Union Government President 2024/2025 academic session.',
        status: 'active',
        createdAt: new Date().toISOString(),
        candidates: [
            { id: randomUUID(), name: 'Emeka Okafor', post: 'SUG President', department: 'Computer Science', level: '400 Level', manifesto: 'Better welfare, stronger voice, improved campus facilities.', avatar: 'EO', color: '#00e5a0' },
            { id: randomUUID(), name: 'Fatima Bello', post: 'SUG President', department: 'Law', level: '400 Level', manifesto: 'Transparent leadership, student rights protection, academic excellence.', avatar: 'FB', color: '#60a5fa' },
            { id: randomUUID(), name: 'Chukwuemeka Nwosu', post: 'SUG President', department: 'Economics', level: '500 Level', manifesto: 'Unity, progress, and accountability for every student.', avatar: 'CN', color: '#f472b6' },
        ],
    },
    {
        id: randomUUID(),
        title: 'SUG Vice President',
        description: 'Election for the Student Union Government Vice President 2024/2025.',
        status: 'active',
        createdAt: new Date().toISOString(),
        candidates: [
            { id: randomUUID(), name: 'Amina Yusuf', post: 'SUG Vice President', department: 'Mass Communication', level: '300 Level', manifesto: 'Supporting the president, amplifying student voices across all faculties.', avatar: 'AY', color: '#a78bfa' },
            { id: randomUUID(), name: 'David Eze', post: 'SUG Vice President', department: 'Electrical Engineering', level: '400 Level', manifesto: 'Bridging the gap between students and university management.', avatar: 'DE', color: '#fb923c' },
            { id: randomUUID(), name: 'Ngozi Adeyemi', post: 'SUG Vice President', department: 'Accounting', level: '300 Level', manifesto: 'Financial transparency and welfare support for all students.', avatar: 'NA', color: '#34d399' },
        ],
    },
    {
        id: randomUUID(),
        title: 'SUG Secretary General',
        description: 'Election for the Student Union Government Secretary General 2024/2025.',
        status: 'active',
        createdAt: new Date().toISOString(),
        candidates: [
            { id: randomUUID(), name: 'Ibrahim Hassan', post: 'SUG Secretary General', department: 'Business Administration', level: '300 Level', manifesto: 'Efficient record keeping, timely communication, and organised student governance.', avatar: 'IH', color: '#facc15' },
            { id: randomUUID(), name: 'Chioma Obi', post: 'SUG Secretary General', department: 'English & Literary Studies', level: '300 Level', manifesto: 'Clear documentation, open meetings, and accessible student records.', avatar: 'CO', color: '#00e5a0' },
        ],
    },
    {
        id: randomUUID(),
        title: 'SUG Financial Secretary',
        description: 'Election for the Student Union Government Financial Secretary 2024/2025.',
        status: 'active',
        createdAt: new Date().toISOString(),
        candidates: [
            { id: randomUUID(), name: 'Tunde Afolabi', post: 'SUG Financial Secretary', department: 'Accounting', level: '400 Level', manifesto: 'Zero mismanagement, full accountability, published financial reports every semester.', avatar: 'TA', color: '#60a5fa' },
            { id: randomUUID(), name: 'Blessing Okoro', post: 'SUG Financial Secretary', department: 'Economics', level: '300 Level', manifesto: 'Every kobo of student dues will be tracked and reported openly.', avatar: 'BO', color: '#f472b6' },
            { id: randomUUID(), name: 'Musa Aliyu', post: 'SUG Financial Secretary', department: 'Business Administration', level: '400 Level', manifesto: 'Prudent financial management and transparent budgeting for student activities.', avatar: 'MA', color: '#a78bfa' },
        ],
    },
    {
        id: randomUUID(),
        title: 'Director of Socials',
        description: 'Election for the SUG Director of Socials — responsible for student events and welfare.',
        status: 'active',
        createdAt: new Date().toISOString(),
        candidates: [
            { id: randomUUID(), name: 'Precious Nwachukwu', post: 'Director of Socials', department: 'Theatre Arts', level: '200 Level', manifesto: 'More events, bigger freshers week, cultural nights, and an active student social calendar.', avatar: 'PN', color: '#fb923c' },
            { id: randomUUID(), name: 'Seun Adewale', post: 'Director of Socials', department: 'Mass Communication', level: '300 Level', manifesto: 'Inclusive events for every student, not just the popular crowd.', avatar: 'SA', color: '#34d399' },
        ],
    },
    {
        id: randomUUID(),
        title: 'Computer Science Departmental Rep',
        description: 'Election for the CS Departmental Representative to the Student Union.',
        status: 'active',
        createdAt: new Date().toISOString(),
        candidates: [
            { id: randomUUID(), name: 'Kelechi Okonkwo', post: 'CS Departmental Rep', department: 'Computer Science', level: '300 Level', manifesto: 'Better lab facilities, more industry partnerships, and stronger alumni connections.', avatar: 'KO', color: '#00e5a0' },
            { id: randomUUID(), name: 'Adaeze Nnaji', post: 'CS Departmental Rep', department: 'Computer Science', level: '200 Level', manifesto: 'Regular study groups, coding competitions, and improved departmental welfare.', avatar: 'AN', color: '#60a5fa' },
            { id: randomUUID(), name: 'Yinka Ogunleye', post: 'CS Departmental Rep', department: 'Computer Science', level: '300 Level', manifesto: 'Student-lecturer dialogue, better exam timetables, and departmental unity.', avatar: 'YO', color: '#f472b6' },
        ],
    },
]

fs.writeFileSync(DB_PATH, JSON.stringify({ voters: existing.voters, elections, votes: [] }, null, 2))
console.log(`✅ Seeded ${elections.length} elections with ${elections.reduce((a, e) => a + e.candidates.length, 0)} candidates.`)
console.log('   Your voter accounts have been kept. All previous votes cleared.')