// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import ManufacturingToolStatistics from '../views/ManufacturingToolStatistics.vue';
import Effectivity from '../views/Effectivity.vue';
import LoadedPrograms from '../views/LoadedPrograms.vue';
import Alarms from '../views/Alarms.vue';
import NotFound from '../views/NotFound.vue';
import store from '../store';
import SignIn from '../views/sessions/SignIn.vue';
import SignUp from '../views/sessions/SignUp.vue';
import { bandsawRoutes } from './bandsaw';

const routes = [
    { path: '/',
        name: 'Home',
        component: () => import('../layout/index.vue'),
        redirect: '/dashboards/dashboard-pegas-gonda',
        meta: {
            title: 'Home',
        },

        children: [
            {
                path: '/dashboards',
                name: 'Dashboards',
                component: () => import('../views/dashboards/index.vue'),
                meta: {
                    title: 'Dashboard',
                },
                children: [
                    {
                        path: '',
                        name: 'dashboard-default',
                        redirect: 'grafana',
                    },
                    {
                        path: 'grafana',
                        name: 'dashboard-grafana',
                        component: () =>
                            import('../views/management/Dashboards.vue'),
                    },
                    {
                        path: 'dashboard-version-one',
                        name: 'dashboard-version-one',
                        component: () =>
                            import('../views/dashboards/Dashboards.v1.vue'),
                    },
                    {
                        path: 'dashboard-pegas-gonda',
                        name: 'dashboard-pegas-gonda',
                        component: () =>
                            import('../views/dashboards/DashboardPeagsGonda.vue'),
                    },
                ],
            },
            // Bandsaw routes (Catalog, Programs, Machines)
            ...bandsawRoutes,
            // Management section
            {
                path: '/management',
                name: 'Management',
                component: () => import('../views/management/index.vue'),
                meta: {
                    title: 'Management',
                },
            },
            {
                path: '/management/datasources',
                name: 'Datasources',
                component: () => import('../views/management/Datasources.vue'),
                meta: {
                    title: 'Datasources',
                },
            },
            {
                path: '/management/dashboards',
                name: 'ManagementDashboards',
                component: () => import('../views/management/Dashboards.vue'),
                meta: {
                    title: 'Dashboards',
                },
            },
            // Notifications
            {
                path: '/notifications',
                name: 'Notifications',
                component: () => import('../views/Notifications.vue'),
                meta: {
                    title: 'Notifications',
                },
            },
            // Help
            {
                path: '/help',
                name: 'Help',
                component: () => import('../views/Help.vue'),
                meta: {
                    title: 'Help',
                },
            },
            {
                path: '/components',
                name: 'components',
                component: () => import('../views/components/index.vue'),
                meta: {
                    title: 'Components',
                },
                children: [
                    {
                        path: 'button',
                        name: 'button',
                        component: () =>
                            import('../views/components/Button.vue'),
                    },
                ],
            },
            {
                path: '/profile',
                name: 'profile',
                component: () => import('../views/profile/index.vue'),
                meta: {
                    title: 'Profile',
                },
                children: [
                    {
                        path: 'profileTwo',
                        name: 'ProfileTwo',
                        component: () =>
                            import('../views/profile/ProfileTwo.vue'),
                    },
                ],
            },
        ],
    },
    { path: '/signIn', component: SignIn },
    { path: '/signUp', component: SignUp },
    { path: '/:path(.*)', component: NotFound },
    { path: '/manufacturing-tool-statistics', name: 'ManufacturingToolStatistics', component: ManufacturingToolStatistics },
    { path: '/effectivity', name: 'Effectivity', component: Effectivity },
    { path: '/loaded-programs', name: 'LoadedPrograms', component: LoadedPrograms },
    { path: '/alarms', name: 'Alarms', component: Alarms },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.afterEach(() => {
    if (window.innerWidth <= 1200) {
        const sidenav =
            store.state.largeSidebar.sidebarToggleProperties.isSideNavOpen

        store.commit('largeSidebar/toggleSidebarProperties')
    }
})

export default router;

/* import { createRouter, createWebHistory } from 'vue-router'
import NotFound from '../views/NotFound.vue'
import store from '../store'
import SignIn from '../views/sessions/SignIn.vue'
import SignUp from '../views/sessions/SignUp.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../layout/index.vue'),
        redirect: '/dashboards/dashboard-version-one',
        meta: {
            title: 'Home',
        },

        children: [
            {
                path: '/dashboards',
                name: 'Dashboards',
                component: () => import('../views/dashboards/index.vue'),
                meta: {
                    title: 'Dashboard',
                },
                children: [
                    {
                        path: 'dashboard-version-one',
                        name: 'dashboard-version-one',
                        component: () =>
                            import('../views/dashboards/Dashboards.v1.vue'),
                    },
                ],
            },
            {
                path: '/components',
                name: 'components',
                component: () => import('../views/components/index.vue'),
                meta: {
                    title: 'Components',
                },
                children: [
                    {
                        path: 'button',
                        name: 'button',
                        component: () =>
                            import('../views/components/Button.vue'),
                    },
                ],
            },
            {
                path: '/profile',
                name: 'profile',
                component: () => import('../views/profile/index.vue'),
                meta: {
                    title: 'Profile',
                },
                children: [
                    {
                        path: 'profileTwo',
                        name: 'ProfileTwo',
                        component: () =>
                            import('../views/profile/ProfileTwo.vue'),
                    },
                ],
            },
        ],
    },

    { path: '/signIn', component: SignIn },
    { path: '/signUp', component: SignUp },

    { path: '/:path(.*)', component: NotFound },
]

const router = createRouter({
    history: createWebHistory(),
    scrollBehavior(to, from, savedPosition) {
        return { left: 0, top: 0 }
    },
    routes,
})

router.afterEach(() => {
    if (window.innerWidth <= 1200) {
        const sidenav =
            store.state.largeSidebar.sidebarToggleProperties.isSideNavOpen

        store.commit('largeSidebar/toggleSidebarProperties')
    }
})

export default router
 */