// src/router/bandsaw.js
// Router configuration for Bandsaw Management sections

export const bandsawRoutes = [
    {
        path: '/catalog',
        name: 'Catalog',
        component: () => import('../views/bandsaw/Catalog.vue'),
        meta: {
            title: 'Bandsaw Catalog',
        },
    },
    {
        path: '/catalog/machine/:id',
        name: 'MachineDetails',
        component: () => import('../views/bandsaw/MachineDetails.vue'),
        meta: {
            title: 'Machine Details',
        },
    },
    {
        path: '/my-machines',
        name: 'MyMachines',
        component: () => import('../views/bandsaw/MyMachines.vue'),
        meta: {
            title: 'My Machines',
        },
    },
    {
        path: '/my-machines/:id',
        name: 'MachineConfiguration',
        component: () => import('../views/bandsaw/MachineConfiguration.vue'),
        meta: {
            title: 'Machine Configuration',
        },
    },
    {
        path: '/my-machines/:id/maintenance',
        name: 'MachineMaintenance',
        component: () => import('../views/bandsaw/MachineMaintenance.vue'),
        meta: {
            title: 'Maintenance Schedule',
        },
    },
    {
        path: '/programs',
        name: 'Programs',
        component: () => import('../views/bandsaw/Programs.vue'),
        meta: {
            title: 'Cutting Programs',
        },
    },
    {
        path: '/programs/new',
        name: 'NewProgram',
        component: () => import('../views/bandsaw/ProgramEditor.vue'),
        meta: {
            title: 'New Program',
        },
    },
    {
        path: '/programs/:id',
        name: 'EditProgram',
        component: () => import('../views/bandsaw/ProgramEditor.vue'),
        meta: {
            title: 'Edit Program',
        },
    },
];
