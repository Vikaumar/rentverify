package com.rentverify.app.di

import android.content.Context
import android.content.SharedPreferences
import androidx.room.Room
import com.google.firebase.auth.FirebaseAuth
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.rentverify.app.BuildConfig
import com.rentverify.app.data.local.AppDatabase
import com.rentverify.app.data.local.dao.AuditEventDao
import com.rentverify.app.data.local.dao.VerificationDao
import com.rentverify.app.data.remote.ApiService
import com.rentverify.app.data.remote.AuthInterceptor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    // ── Gson ──────────────────────────────────────────────

    @Provides
    @Singleton
    fun provideGson(): Gson = GsonBuilder().create()

    // ── SharedPreferences ─────────────────────────────────

    @Provides
    @Singleton
    fun provideSharedPreferences(@ApplicationContext context: Context): SharedPreferences =
        context.getSharedPreferences("rentverify_prefs", Context.MODE_PRIVATE)

    // ── Auth Interceptor ──────────────────────────────────

    @Provides
    @Singleton
    fun provideAuthInterceptor(): AuthInterceptor = AuthInterceptor()

    // ── OkHttp Client ─────────────────────────────────────

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: AuthInterceptor): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    // ── Retrofit ──────────────────────────────────────────

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, gson: Gson): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService =
        retrofit.create(ApiService::class.java)

    // ── Room Database ─────────────────────────────────────

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "rentverify_cache.db"
        )
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    fun provideVerificationDao(db: AppDatabase): VerificationDao = db.verificationDao()

    @Provides
    fun provideAuditEventDao(db: AppDatabase): AuditEventDao = db.auditEventDao()

    // ── Firebase Auth ─────────────────────────────────────

    @Provides
    @Singleton
    fun provideFirebaseAuth(): FirebaseAuth = FirebaseAuth.getInstance()
}
