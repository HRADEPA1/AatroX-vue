import { createStore } from 'vuex'


import largeSidebar from './modules/largeSidebar'
import panelVisibility from './modules/panelVisibility'
import auth from './modules/auth'


export default  createStore({
    modules: {
        largeSidebar,
        panelVisibility,
        auth
    }
});