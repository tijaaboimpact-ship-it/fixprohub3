using System;
using System.Management;
using System.Security.Cryptography;
using System.Text;

namespace FixProHub.Security
{
    public static class HWIDGenerator
    {
        /// <summary>
        /// Generates a unique, salted SHA-256 Hardware ID based on CPU, MoBo, and BIOS.
        /// </summary>
        public static string Generate()
        {
            try
            {
                string cpuId = GetWmiValue("Win32_Processor", "ProcessorId");
                string boardId = GetWmiValue("Win32_BaseBoard", "SerialNumber");
                string biosId = GetWmiValue("Win32_BIOS", "SerialNumber");
                string diskId = GetWmiValue("Win32_DiskDrive", "SerialNumber"); // Added disk for better uniqueness

                // Create a raw combined string (you should add a fixed app-specific salt)
                string rawHwid = $"{cpuId}-{boardId}-{biosId}-{diskId}-FixProHub2026_Salt";

                return HashSHA256(rawHwid);
            }
            catch (Exception ex)
            {
                // Fallback or error logging
                Console.WriteLine($"HWID Generation Error: {ex.Message}");
                return "HWID_GENERATION_FAILED";
            }
        }

        private static string GetWmiValue(string wmiClass, string property)
        {
            try
            {
                string result = string.Empty;
                using (ManagementClass mc = new ManagementClass(wmiClass))
                {
                    using (ManagementObjectCollection moc = mc.GetInstances())
                    {
                        foreach (ManagementObject mo in moc)
                        {
                            if (mo[property] != null)
                            {
                                result = mo[property].ToString().Trim();
                                break;
                            }
                        }
                    }
                }
                return string.IsNullOrEmpty(result) ? "UNKNOWN" : result;
            }
            catch
            {
                return "UNKNOWN";
            }
        }

        private static string HashSHA256(string input)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(input));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }
}
