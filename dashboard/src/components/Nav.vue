<template>
  <v-app-bar app color="primary" dark>
    <v-btn
      text
      v-for="item in menuItems"
      :key="item.title"
      :to="item.path"
      class="mr-2"
    >
      {{ item.title }}
    </v-btn>

    <v-spacer></v-spacer>

    <v-btn href="https://vuetifyjs.com/en/" target="_blank" text>
      <span class="mr-2">Design documentation</span>
      <v-icon>mdi-open-in-new</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script>
export default {
  data() {
    return {
      menuItems: [
        { title: "Home", path: "/" },
        { title: "Restaurants", path: "/restaurants" },
        { title: "Robots", path: "/robots" }
      ]
    };
  }
};
</script>
