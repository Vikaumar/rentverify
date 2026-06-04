package com.rentverify.app.data.remote

import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

/**
 * OkHttp interceptor that attaches the auth token to all API requests.
 */
@Singleton
class AuthInterceptor @Inject constructor() : Interceptor {

    @Volatile
    var token: String? = null

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val builder = request.newBuilder()

        token?.let {
            builder.addHeader("Authorization", "Bearer $it")
        }

        return chain.proceed(builder.build())
    }
}
