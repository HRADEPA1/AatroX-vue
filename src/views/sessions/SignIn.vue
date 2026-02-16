<template>
  <div class="auth-layout-wrap flex justify-center min-h-screen flex-col bg-cover items-center" :style="backgroundStyle">
    <div class="container-session-v1 w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="p-8">
          <!-- Logo / Title -->
          <div class="text-center mb-6">
            <i class="i-Gear text-5xl text-purple-500 mb-2 block"></i>
            <h1 class="text-2xl font-semibold text-gray-800">Pegas Gonda</h1>
            <p class="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <!-- Login mode tabs -->
          <div class="flex mb-6 border-b border-gray-200">
            <button
              @click="loginMode = 'password'"
              :class="loginMode === 'password' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
              class="flex-1 py-2 text-sm font-medium border-b-2 transition-colors text-center"
            >
              <i class="i-Lock-2 mr-1"></i> Password
            </button>
            <button
              @click="loginMode = 'pin'"
              :class="loginMode === 'pin' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
              class="flex-1 py-2 text-sm font-medium border-b-2 transition-colors text-center"
            >
              <i class="i-Key mr-1"></i> Operator PIN
            </button>
          </div>

          <!-- Error message -->
          <div v-if="loginError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {{ loginError }}
          </div>

          <!-- Password login form -->
          <form v-if="loginMode === 'password'" @submit.prevent="handleLogin">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                v-model="username"
                type="text"
                required
                autofocus
                class="w-full px-4 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 border border-gray-300 rounded-lg"
                placeholder="Enter your username"
              />
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                v-model="password"
                type="password"
                required
                class="w-full px-4 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 border border-gray-300 rounded-lg"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">Signing in...</span>
              <span v-else>Sign In</span>
            </button>
          </form>

          <!-- PIN login form -->
          <form v-if="loginMode === 'pin'" @submit.prevent="handlePinLogin">
            <div class="mb-2 text-center">
              <p class="text-sm text-gray-500">Enter your 4-6 digit PIN code</p>
              <p class="text-xs text-gray-400 mt-1">Available for Operator accounts only</p>
            </div>
            <div class="mb-6 flex justify-center">
              <input
                ref="pinInput"
                v-model="pin"
                type="password"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                required
                class="w-48 px-4 py-4 text-center text-2xl tracking-widest bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 border border-gray-300 rounded-lg"
                placeholder="****"
                @input="onPinInput"
              />
            </div>
            <button
              type="submit"
              :disabled="loading || pin.length < 4"
              class="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">Verifying...</span>
              <span v-else>Sign In with PIN</span>
            </button>
          </form>

          <!-- Default credentials hint -->
          <div class="mt-6 text-center text-xs text-gray-400 space-y-1">
            <p><strong>Test accounts:</strong></p>
            <p>admin / admin123 &nbsp;|&nbsp; service / service123</p>
            <p>user / user1234 &nbsp;|&nbsp; operator / operator123</p>
            <p>Operator PIN: 1234</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import backgroundImage from '@/assets/images/background_1280.jpg';

export default {
  name: 'SignIn',
  data() {
    return {
      loginMode: 'password',
      username: '',
      password: '',
      pin: '',
    };
  },
  computed: {
    ...mapState('auth', ['loading', 'loginError']),
    backgroundStyle() {
      return {
        backgroundImage: `url(${backgroundImage})`,
      };
    },
  },
  watch: {
    loginMode() {
      // Clear error when switching tabs
      this.$store.commit('auth/SET_LOGIN_ERROR', null);
    },
  },
  methods: {
    async handleLogin() {
      const success = await this.$store.dispatch('auth/login', {
        username: this.username,
        password: this.password,
      });
      if (success) {
        const redirect = this.$route.query.redirect || '/';
        this.$router.push(redirect);
      }
    },
    async handlePinLogin() {
      const success = await this.$store.dispatch('auth/loginWithPin', {
        pin: this.pin,
      });
      if (success) {
        const redirect = this.$route.query.redirect || '/';
        this.$router.push(redirect);
      }
    },
    onPinInput(e) {
      // Allow only digits
      this.pin = this.pin.replace(/[^0-9]/g, '');
    },
  },
};
</script>
