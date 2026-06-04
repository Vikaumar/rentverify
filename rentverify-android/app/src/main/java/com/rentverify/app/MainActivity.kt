package com.rentverify.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.rentverify.app.ui.navigation.RentVerifyNavHost
import com.rentverify.app.ui.theme.RentVerifyTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Extract deep link token if present
        val guestToken = intent?.data?.getQueryParameter("token")

        setContent {
            RentVerifyTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    RentVerifyNavHost(guestToken = guestToken)
                }
            }
        }
    }
}
