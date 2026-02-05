<script>
import packageInfo from '../../package.json';

export default {
    computed: {
        version() {
            return packageInfo.version;
        }
    }
}
</script>

<template>
    <footer class="mt-10">
        <div class="container-fluid mx-auto">
            <BaseCard class="">
                <div class="flex flex-col lg:flex-row items-center justify-between">
                    <div>
                        <p>
                            Created by :
                            <a
                                class="text-primary underline"
                                href="https://testbed.ciirc.cvut.cz/"
                                target="_blank"
                                rel="noopener noreferrer"
                                >RICAIP Testbed Prague</a
                            >
                        </p>
                    </div>
                    <div class="mt-2 lg:mt-0">
                        <p class="text-sm text-gray-600">
                            Version {{ version }}
                        </p>
                    </div>
                </div>
            </BaseCard>
        </div>
    </footer>
</template>
