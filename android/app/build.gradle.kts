import java.net.URI

plugins {
    id("com.android.application")
}

val kneeOrigin = providers.gradleProperty("kneeOrigin")
    .orElse("https://knee.vankotraining.cz")
    .get()
    .trimEnd('/')
val kneeHost = URI(kneeOrigin).host ?: error("kneeOrigin must contain a valid HTTPS host")
val kneeAssetStatements = """[{\"relation\":[\"delegate_permission/common.handle_all_urls\"],\"target\":{\"namespace\":\"web\",\"site\":\"$kneeOrigin\"}}]"""

val signingStorePath = providers.gradleProperty("kneeSigningStore").orNull
val signingStorePassword = providers.gradleProperty("kneeSigningStorePassword").orNull
val signingKeyAlias = providers.gradleProperty("kneeSigningKeyAlias").orNull
val signingKeyPassword = providers.gradleProperty("kneeSigningKeyPassword").orNull
val hasPreviewSigning = listOf(
    signingStorePath,
    signingStorePassword,
    signingKeyAlias,
    signingKeyPassword,
).all { !it.isNullOrBlank() }

android {
    namespace = "cz.vankotraining.knee"
    compileSdk = 36

    defaultConfig {
        applicationId = "cz.vankotraining.knee"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"

        buildConfigField("String", "KNEE_ORIGIN", "\"$kneeOrigin\"")
        resValue("string", "asset_statements", kneeAssetStatements)
        manifestPlaceholders["kneeHost"] = kneeHost
    }

    val previewSigning = if (hasPreviewSigning) {
        signingConfigs.create("preview") {
            storeFile = file(signingStorePath!!)
            storePassword = signingStorePassword
            keyAlias = signingKeyAlias
            keyPassword = signingKeyPassword
        }
    } else {
        null
    }

    buildTypes {
        debug {
            if (previewSigning != null) signingConfig = previewSigning
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.browser:browser:1.10.0")
    testImplementation("junit:junit:4.13.2")
}
