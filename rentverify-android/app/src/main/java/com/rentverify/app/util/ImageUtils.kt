package com.rentverify.app.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import java.io.ByteArrayOutputStream
import java.io.InputStream

/**
 * Utility functions for image scaling, rotation correction, and Base64 compression.
 */
object ImageUtils {

    /**
     * Reads a Uri, scales it to [maxDim], rotates it based on EXIF, compresses it to JPEG,
     * and returns a Base64 data URL string.
     */
    fun uriToBase64(context: Context, uri: Uri, maxDim: Int): String? {
        return try {
            var input: InputStream? = context.contentResolver.openInputStream(uri) ?: return null
            val options = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            BitmapFactory.decodeStream(input, null, options)
            input?.close()

            // Calculate sample size
            var sampleSize = 1
            val srcWidth = options.outWidth
            val srcHeight = options.outHeight
            if (srcWidth > maxDim || srcHeight > maxDim) {
                val halfWidth = srcWidth / 2
                val halfHeight = srcHeight / 2
                while ((halfWidth / sampleSize) >= maxDim && (halfHeight / sampleSize) >= maxDim) {
                    sampleSize *= 2
                }
            }

            // Decode actual bitmap
            input = context.contentResolver.openInputStream(uri)
            val decodeOptions = BitmapFactory.Options().apply {
                inSampleSize = sampleSize
            }
            var bitmap = BitmapFactory.decodeStream(input, null, decodeOptions) ?: return null
            input?.close()

            // Correct EXIF orientation
            val orientation = getOrientation(context, uri)
            if (orientation != 0) {
                val matrix = Matrix().apply { postRotate(orientation.toFloat()) }
                val rotatedBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                if (rotatedBitmap != bitmap) {
                    bitmap.recycle()
                    bitmap = rotatedBitmap
                }
            }

            // Scale to exact dimension if still exceeding limit
            if (bitmap.width > maxDim || bitmap.height > maxDim) {
                val ratio = bitmap.width.toFloat() / bitmap.height.toFloat()
                val newWidth: Int
                val newHeight: Int
                if (ratio > 1) {
                    newWidth = maxDim
                    newHeight = (maxDim / ratio).toInt()
                } else {
                    newHeight = maxDim
                    newWidth = (maxDim * ratio).toInt()
                }
                val scaledBitmap = Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
                if (scaledBitmap != bitmap) {
                    bitmap.recycle()
                    bitmap = scaledBitmap
                }
            }

            // Compress to JPEG and convert to Base64
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
            val bytes = outputStream.toByteArray()
            bitmap.recycle()

            val base64Str = Base64.encodeToString(bytes, Base64.NO_WRAP)
            "data:image/jpeg;base64,$base64Str"
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun getOrientation(context: Context, uri: Uri): Int {
        return try {
            val input = context.contentResolver.openInputStream(uri) ?: return 0
            val exif = ExifInterface(input)
            val orientation = exif.getAttributeInt(
                ExifInterface.TAG_ORIENTATION,
                ExifInterface.ORIENTATION_NORMAL
            )
            input.close()
            when (orientation) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90
                ExifInterface.ORIENTATION_ROTATE_180 -> 180
                ExifInterface.ORIENTATION_ROTATE_270 -> 270
                else -> 0
            }
        } catch (e: Exception) {
            0
        }
    }
}
