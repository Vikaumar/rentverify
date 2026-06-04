package com.rentverify.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = Purple500,
    onPrimary = TextPrimary,
    primaryContainer = Purple700,
    onPrimaryContainer = TextPrimary,
    secondary = Green500,
    onSecondary = DarkBg,
    secondaryContainer = Green200,
    tertiary = Yellow500,
    onTertiary = DarkBg,
    background = DarkBg,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = TextSecondary,
    error = Red500,
    onError = TextPrimary,
    outline = GlassBorder,
    outlineVariant = TextMuted,
)

@Composable
fun RentVerifyTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = RentVerifyTypography,
        shapes = RentVerifyShapes,
        content = content
    )
}
