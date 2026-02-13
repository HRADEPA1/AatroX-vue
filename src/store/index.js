import { createStore } from 'vuex'


import largeSidebar from './modules/largeSidebar'
import panelVisibility from './modules/panelVisibility'


export default  createStore({
    modules: {
        largeSidebar,
        panelVisibility
    }
});